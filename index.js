/*
 *  MAIN STARTING FILE => Treats all dependencies and links
 */
/* ====== DEPENDANCIES ====== */
const app = require('./app');


/* ======  VARIABLES   ====== */
const PORT = process.env.PORT || 8080;


/* ====== SERVER ====== */
const server = app.listen(PORT, () => console.log(`Server runs on 'localhost:${ PORT }'`));


/**
@TODO
 - système pseudo
 - temps  => temps de réaction moyen
 - update des scores à chaque réponse
 - système de logs
*/
