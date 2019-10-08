function runSocket(server) {
    let io = require('socket.io').listen(server);

    // Just shows a simple HELLO message when a new client is connected
    io.sockets.on('connection', function(socket) {
        console.log('A client says hi!');
    });
}





/* ====== SOCKET IO EXPORT ====== */
module.exports = {
    runSocket: runSocket
};
