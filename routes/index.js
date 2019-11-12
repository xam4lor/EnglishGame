/*
 *  TREATS ALL ROOT DIRECTORIES AND WEB LINKS
 */

/* ====== DEPENDANCIES ====== */
const m = {
    express         : require('express'),
    s_io            : require('./socket-io-comms'),
    config          : require('./../datas/config.json'),
    g_sentences     : require('./../datas/sentences.json')
};
const router = m.express.Router();


function init(io) {
    global.gameInstance = new m.s_io.party(io, m.g_sentences.game_sentences, m.config.game_config);
}

/**
* @return the player uuid
*/
function getPlUUIDByRequest(req, res) {
    return req.cookies._ga;      // UUID USING THE GOOGLE ANALYTICS COOKIE
}




/* ====== APP ====== */
router
    // pages
    .get('/', (req, res) => {
        res.render('pages/accueil', { error: req.query.error });
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
        let plUUID = getPlUUIDByRequest(req, res);

        if(!req.body.room_id || !p || !p.players || !p.players[plUUID] || !p.players[plUUID].is_main_user)
            res.redirect('/');
        else {
            if(Object.keys(p.players).length < gameInstance.config.players_count.min) {
                res.redirect(`/game/waiting?room_id=${req.body.room_id}`);
                return;
            }

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

        res.render('game/logic/create_game', {
            room_id   : p.id,
            min_round : gameInstance.config.rounds.min,
            max_round : gameInstance.config.rounds.max
        });
    })

    // waiting for other players
    .get('/game/waiting', (req, res) => {
        let p = gameInstance.getParty(req.query.room_id);
        let plUUID = getPlUUIDByRequest(req, res);

        if(!req.query.room_id || !p)
            res.redirect('/');
        else {
            if(Object.keys(p.players).length >= gameInstance.config.players_count.max) {
                res.redirect('/?error=1');
                return;
            }

            if(p.finished)
                res.redirect(`/game/results?room_id=${req.query.room_id}`);
            else if(!p.began)
                res.render('game/logic/waiting_screen', {
                    room_id        : req.query.room_id,
                    is_super_admin : gameInstance.isSuperAdmin(plUUID, req.query.room_id),
                    min_players    : gameInstance.config.players_count.min,
                    max_players    : gameInstance.config.players_count.max
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
        if(p.game.current_round == 1 && p.game.sentences_id_done.length == 0)
            gameInstance.generateNextSentence(p);


        if(p.game.current_round == gameInstance.config.round_count + 1) {
            p.finished = true;
            res.redirect(`/game/results?room_id=${req.query.room_id}`);
            return;
        }


        if(p.game.current_round_id == 0)
            res.render('game/playing/answer_page', {
                room_id      : req.query.room_id,
                c_sentence   : p.game.current_sentence,
                min_chars    : gameInstance.config.chars_per_hole.min,
                max_chars    : gameInstance.config.chars_per_hole.max
            });
        else if(p.game.current_round_id == 1)
            res.render('game/playing/vote_page', {
                room_id   : req.query.room_id,
                players_i : JSON.stringify(gameInstance.getOPlayerInfos(p))
            });
        else
            console.error("p.game.current_round_id = " + p.game.current_round_id);
    })


    .get('/game/results', (req, res) => {
        let p = gameInstance.getParty(req.query.room_id);
        let plUUID = getPlUUIDByRequest(req, res);

        if(!req.query.room_id || !p || !p.players || !p.players[plUUID]) {
            res.redirect('/');
            return;
        }

        p.players[plUUID].results_shown = true;
        res.render('game/logic/results_game', { pScores: JSON.stringify(gameInstance.getOPlayerScores(p)) });


        // if every player saw the results, delete the party
        let rt = 0;
        let arr = Object.keys(p.players);
        for (let i = 0; i < arr.length; i++)
            if(p.players[arr[i]].results_shown)
                rt++;

        if(arr.length == rt)
            gameInstance.deleteParty(p);
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
