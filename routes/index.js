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

    // game-logic
    .get('/game/configuration', (req, res) => {
        let p = gameInstance.createParty();
        res.render('game/logic/create_game', { room_id: p.id });
    })

    // send game super-user config
    .post('/req/set_config', (req, res) => {
        let ans = gameInstance.handleConfig(req.body); // true if no errors

        if(ans)
            res.redirect(`/game/waiting?room_id=${req.body.room_id}`);
        else
            res.redirect('/game/configuration');
    })

    // waiting for other players
    .get('/game/waiting', (req, res) => {
        let p = gameInstance.getParty(req.query.room_id);
        if(!req.query.room_id || !p)
            res.redirect('/');
        else {
            if(!p.began)
                res.render('game/logic/waiting_screen', { room_id: req.query.room_id });
            else
                res.render(''); // redirect to party
        }
    })


    .get('/game/results', (req, res) => res.render('game/logic/results_game'))

    // game-playing
    .get('/game/answer', (req, res) => res.render('game/playing/answer_page'))
    .get('/game/results', (req, res) => res.render('game/playing/vote_page'))




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
