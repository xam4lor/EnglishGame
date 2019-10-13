class GameParty {
    constructor(io) {
        this.party_list = [];
        this.id_list    = [0];
        this.io         = io;
    }

    // If already in a game, combine socketIp with globalIp
    handleAdress(globalIp, socketIp) {
        let found = false;
        for (let i = 0; i < party_list.length; i++) {
            if(party_list[i].players[globalIp]) {
                party_list[i].players[globalIp].global_ip = globalIp;
                party_list[i].players[globalIp].socket_ip = socket_ip;
                found = true;
                break;
            }
        }
    }





    createParty() {
        let token = 0;
        while(this.id_list.includes(token)) {
            //token = Math.round(Math.random() * 100000000);
            token = 3;
        }
        this.id_list.push(token);

        let p = {
            id: "r_" + token,
            began: false,
            config: {

            },
            players: {
                // "TEMPLATE_IP": {
                //     is_main_user: false,
                //     "global_ip" : "",
                //     "socket_ip" : ""
                // }
            },
            game: {
                current_round: 0,
                sentences_id_done: []
            }
        };

        this.party_list.push(p);

        return p;
    }
}

function runSocket(server) {
    let io = require('socket.io').listen(server);


    // On a new client is connected
    io.sockets.on('connection', function(socket) {
        // Handle local and socket ip if he isn't a "new" user
        let adress = socket.request.connection.remoteAddress;
        gameInstance.handleAdress(adress, socket.id);


        socket.on('join_room', function(room) {
            socket.join(room);
        });
    });

    return io;
}





/* ====== SOCKET IO EXPORT ====== */
module.exports = {
    runSocket: runSocket,
    party    : GameParty
};
