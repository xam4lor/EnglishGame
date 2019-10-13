/*
 *  TREATS ALL ROOT DIRECTORIES AND WEB LINKS
 */

/* ====== DEPENDANCIES ====== */
const m = {
    express : require('express')
};


const router = m.express.Router();




/* ====== APP ====== */
router
    // root folder
    .get('/', (req, res) => res.render('pages/accueil'))
;







/* ====== SERVER ====== */
module.exports = router;
