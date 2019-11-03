/*
 *  TREATS ALL ROOT DIRECTORIES AND WEB LINKS
 */

/* ====== DEPENDANCIES ====== */
const m = {
    express : require('express'),
    s_io    : require('./socket-io-comms')
};
const router = m.express.Router();


function init(io) {
    global.gameInstance = new m.s_io.party(io);
}




/* ====== APP ====== */
router
    // pages
    .get('/', (req, res) => {
        res.render('pages/accueil');
    })


    // send game super-user config
    .post('/req/set_config', (req, res) => {
        let ans = gameInstance.handleConfig(req.body); // true if no errors

        if(ans)
            res.redirect(`/game/waiting?room_id=${req.body.room_id}`);
        else
            res.redirect('/game/configuration');
    })

    // launching of the party
    .post('/req/begin_party', (req, res) => {
        let p = gameInstance.getParty(req.body.room_id);

        if(!req.body.room_id || !p || !p.players || !p.players[req.ip] || !p.players[req.ip].is_main_user)
            res.redirect('/');
        else {
            if(!p.began) { // begin party
                p.began = true;
                p.game.current_round = 1;
            }

            res.redirect(`/game/playing?room_id=${req.body.room_id}`); // redirect to party if party began
        }
    })


    // game-logic
    .get('/game/configuration', (req, res) => {
        let p = gameInstance.createParty();
        res.render('game/logic/create_game', { room_id: p.id });
    })

    // waiting for other players
    .get('/game/waiting', (req, res) => {
        let p = gameInstance.getParty(req.query.room_id);

        if(!req.query.room_id || !p)
            res.redirect('/');
        else {
            if(!p.began)
                res.render('game/logic/waiting_screen', {
                    room_id: req.query.room_id,
                    is_super_admin: gameInstance.isSuperAdmin(req.ip, req.query.room_id)
                });
            else
                res.redirect(`/game/playing?room_id=${req.query.room_id}`); // redirect to party if party began
        }
    })

    // game-playing
    .get('/game/playing', (req, res) => {
        let p = gameInstance.getParty(req.query.room_id);

        // === check if any error ===
        if(!req.query.room_id || !p) {
            res.redirect('/');
            return;
        }

        if(!p.began) {
            res.redirect(`/game/waiting?room_id=${req.query.room_id}`);
            return;
        }



        // === handle game ===
        if(p.game.current_round == p.config.round_count + 1) {
            res.redirect(`/game/results?room_id=${req.query.room_id}`);
            return;
        }


        if(p.game.current_round_id == 0)
            res.render('game/playing/answer_page');
        else if(p.game.current_round_id == 1)
            res.render('game/playing/vote_page');
    })


    .get('/game/results', (req, res) => {
        let p = gameInstance.getParty(req.query.room_id);

        if(!req.query.room_id || !p || !p.players || !p.players[req.ip]) {
            res.redirect('/');
            return;
        }

        res.render('game/logic/results_game', { pScores: JSON.stringify(p.players) });
    })





    // for debugging
    .get('/debug', (req, res) => {
        console.log(gameInstance.party_list);

        if(gameInstance.party_list[0])
            console.log(gameInstance.party_list[0].players);
    })
;







/* ====== SERVER ====== */
module.exports = {
    router: router,
    init:   init
};
