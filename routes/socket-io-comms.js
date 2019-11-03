class GameParty {
    constructor(io) {
        this.party_list = [];
        this.id_list    = [0];
        this.io         = io;

        // To create a default void party for debugging
        // this.createParty();
    }



    /**
    * If already in a game, combine socketIp with globalIp
    * @param globalIp Global ip
    * @param socket Socket thread
    */
    handleAdress(globalIp, socket) {
        let socketIp = socket.id;

        for (let i = 0; i < this.party_list.length; i++) {
            let p = this.party_list[i];

            if(p.players[globalIp]) {
                p.players[globalIp].global_ip = globalIp;
                p.players[globalIp].socket_ip = socketIp;

                socket.emit('redirect_user', '/game/waiting?room_id=' + p.id);
                break;
            }
        }
    }


    /**
    * Joins a player to a specific party
    * @param localIp User global ip
    * @param socketId SocketIo ip
    * @param roomId Id of the party
    * @param isMainUser true if the user is the main user of the party
    * @param socket the listening socket
    */
    joinPlayerTo(localIp, socketId, roomId, isMainUser, socket) {
        let pa = this.getParty(roomId);
        if(pa && pa.players[localIp] == undefined) {
            pa.players[localIp] = {
                global_ip: localIp,
                socket_ip: socketId
            };

            if(isMainUser) pa.players[localIp].is_main_user = isMainUser;

            socket.broadcast.to(roomId).emit('new_player', Object.keys(pa.players).length);
        }

        socket.join(roomId);
    }






    /**
    * Creates a new party
    */
    createParty() {
        let token = 0;
        while(this.id_list.includes(token)) {
            token = Math.round(Math.random() * 100000000);
        }
        this.id_list.push(token);

        let p = {
            id: "r_" + token,
            began: false,
            config: {
                round_count : 5
            },
            players: {
                // "global_ip": {
                //     is_main_user: false,
                //     global_ip : "",
                //     socket_ip : ""
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



    /**
    * Check the config integrity and handle it
    * @param b the req.body parameters
    * @return true if values are OK and integrity is verified
    */
    handleConfig(b) {
        if(!b.room_id || !b.round_count || isNaN(b.round_count)) {
            this.party_list.pop();
            this.id_list.pop();
            return false;
        }

        let p = this.getParty(b.room_id);
        if(!p) return false;

        p.config.round_count = parseInt(b.round_count);

        return true;
    }






    /**
    * @param partyId the ID of the party
    * @return a party or null if no party with that name found
    */
    getParty(partyId) {
        for (let i = 0; i < this.party_list.length; i++)
            if(this.party_list[i].id == partyId)
                return this.party_list[i];

        return null;
    }
}



function runSocket(server) {
    let io = require('socket.io').listen(server);


    // On a new client is connected
    io.sockets.on('connection', function(socket) {
        // Handle local and socket ip if he isn't a "new" user
        let adress = socket.request.connection.remoteAddress;
        gameInstance.handleAdress(adress, socket);


        socket.on('join_room', function(room, isMainUser) {
            gameInstance.joinPlayerTo(adress, socket.id, room, isMainUser, socket);
        });
    });

    return io;
}





/* ====== SOCKET IO EXPORT ====== */
module.exports = {
    runSocket: runSocket,
    party    : GameParty
};
