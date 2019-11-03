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
                socket_ip: socketId,
                pseudo: "not implemented yet",
                points : {
                    fastest: 0,
                    popular: 0
                },
                results_shown: false
            };

            if(isMainUser) pa.players[localIp].is_main_user = isMainUser;

            socket.broadcast.to(roomId).emit('new_player', Object.keys(pa.players).length);
        }

        socket.join(roomId);
    }


    /**
    * @param localIp the ip to be tested
    * @param roomId
    * @return true if the user is the super admin of the party
    */
    isSuperAdmin(localIp, roomId) {
        let pa = this.getParty(roomId);

        if(pa && pa.players && pa.players[localIp] != undefined && pa.players[localIp] && pa.players[localIp].is_main_user)
            return true;
        return false;
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
            config: { // default and minimal config if any bug occurs
                round_count : 1
            },
            players: {
                // "global_ip_xxx": {
                //     is_main_user: false,
                //     global_ip : "xxxx",
                //     socket_ip : "xxxx",
                /** @TODO implement the next line */
                //     pseudo : "xxxx",
                //     points : {
                //          fastest: 0,
                //          popular: 0
                //     },
                //     results_shown: false
                // }
            },
            game: {
                current_round: 0,    // first round is 1
                current_round_id: 0, // 0 for answering and 1 for voting
                sentences_id_done: []
            }
        };

        this.party_list.push(p);

        return p;
    }

    /**
    * Delete a party from the list
    * @param party the party to be deleted
    */
    deleteParty(party) {
        this.party_list.pop(party);
    }



    /**
    * Check the config integrity and handle it
    * @param b the req.body parameters
    * @return true if values are OK and integrity is verified
    */
    handleConfig(b) {
        if(!b.room_id || !b.round_count || isNaN(b.round_count) || parseInt(b.round_count) < 0) {
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
