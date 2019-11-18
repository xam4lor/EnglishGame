/*
 *  MAIN STARTING FILE => Treats all dependencies and links
 */
/* ====== DEPENDANCIES ====== */
const app = require('./app');


/* ======  VARIABLES   ====== */
const PORT = process.env.PORT || 8080;


/* ====== SERVER ====== */
const server = app.listen(PORT, () => console.log(`Le serveur tourne sur le port ${ PORT } (@see 'localhost:${ PORT }')... Faites un effort quoi :/`));


/**
@TODO
 - système pseudo
 - temps  => temps de réaction moyen
 - update des scores à chaque réponse
 - système de logs
*/
