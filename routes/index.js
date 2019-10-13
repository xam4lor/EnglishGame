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

        gameInstance.io.sockets.in(3).emit('message', 'Hi there!');
    })

    // game-logic
    .get('/req/new_game', (req, res) => {
        let p = gameInstance.createParty();
        res.render('game/logic/create_game', { room_id: p.id });
    })

    //.get('/game/config', (req, res) => res.render('game/logic/create_game'))
    .get('/game/waiting', (req, res) => {
        res.render('game/logic/waiting_screen');
    })
    .get('/game/results', (req, res) => res.render('game/logic/results_game'))

    // game-playing
    .get('/game/answer', (req, res) => res.render('game/playing/answer_page'))
    .get('/game/results', (req, res) => res.render('game/playing/vote_page'))
;







/* ====== SERVER ====== */
module.exports = {
    router: router,
    init:   init
};
