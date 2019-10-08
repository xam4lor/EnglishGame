/*
 *  TREATS ALL APP FILES
 */

/* ====== DEPENDENCIES ====== */
const m = {
    express        : require('express'),
    sitemap        : require('sitemap'),
    os             : require('os'),
    path           : require('path'),
    body_parser    : require('body-parser'),
    config         : require('./datas/config.json'),
    routes         : require('./routes/index')
};







/* ======  VARIABLES   ====== */
// == Configs constants ==
const IS_HTTPS = m.config.is_https;
const SITE     = m.config.site;
const VERSION  = m.config.version;



// == Server ==
let isLocalHost = m.os.hostname().indexOf("local");
const PORT      = process.env.PORT || m.config.local_port;
const HOST      = isLocalHost > -1 ? SITE : "localhost:" + PORT;
const HTTP_OR_S = IS_HTTPS ? "https://" : "http://";
const HOST_NAME = isLocalHost > -1 ? HTTP_OR_S + HOST : HOST;







/* ====== APP ====== */
    // == Server config dependencies ==
const app = m.express();


    // == Server config ==
app
    .get("/robots.txt", function(req, res) {
        res.header("Content-Type", "text/html");
        res.send("User-agent: *<br />Sitemap: " + HTTP_OR_S + SITE + "/sitemap.xml<br />Disallow :");
    });


let sitemap;
app
    .get("/sitemap.xml",async  function(req, res) {
        let sitemap = m.sitemap.createSitemap({
            hostname: HOST_NAME,
            cacheTime: m.config.cache_time,
            urls: [{ url: HOST_NAME + '/' }]
        });
        res.header("Content-Type", "application/xml");
        res.send(sitemap.toString());
    })




    // == Render views engine ==
    .use(m.express.static(m.path.join(__dirname, "public")))
    .set("views", m.path.join(__dirname, "views"))
    .set("view engine", "ejs")

    .use(m.body_parser.json())
    .use(m.body_parser.urlencoded({
        extended: true
    }))




    // == Files ==
app
    .use('/', m.routes);




    // == Errors ==
app
    .use((req, res, next) => res.status(404).render('pages/error', {
        errorCode     : 404,
        errorMessage  : 'La page n\'a pas été trouvée'
    }));







/* ====== MODULE ====== */
module.exports = app;
