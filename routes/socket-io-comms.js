class GameParty {
    constructor(io, sentences, config) {
        this.party_list = [];
        this.id_list    = [0];
        this.io         = io;
        this.sentences  = sentences;
        this.config     = config;

        // To create a default void party for debugging
        // this.createParty();
    }



    /**
    * If already in a game, combine socketIp with globalIp
    * @param playerUUID UUID of the player
    * @param socket Socket thread
    */
    handleAdress(playerUUID, socket) {
        let socketIp = socket.id;

        for (let i = 0; i < this.party_list.length; i++) {
            let p = this.party_list[i];

            if(p.players[playerUUID]) {
                p.players[playerUUID].global_uuid = playerUUID;
                p.players[playerUUID].socket_ip = socketIp;

                socket.emit('redirect_user', '/game/waiting?room_id=' + p.id);
                break;
            }
        }
    }


    /**
    * Joins a player to a specific party
    * @param playerUUID User global UUID
    * @param socketId SocketIo ip
    * @param roomId Id of the party
    * @param isMainUser true if the user is the main user of the party
    * @param socket the listening socket
    */
    joinPlayerTo(playerUUID, socketId, roomId, isMainUser, socket) {
        let pa = this.getParty(roomId);
        if(pa && pa.players[playerUUID] == undefined) {
            pa.players[playerUUID] = {
                uuid: pa.config.next_player_uuid,
                global_uuid: playerUUID,
                socket_ip: socketId,
                pseudo: "not implemented yet",
                last_answer : "",
                last_answer_round_id : -1,
                points : {
                    fastest: 0,
                    popular: 0
                },
                results_shown: false,
                is_main_user: isMainUser
            };

            pa.config.next_player_uuid++;

            socket.broadcast.to(roomId).emit('new_player', Object.keys(pa.players).length);
        }

        socket.join(roomId);
    }


    /**
    * @param playerUUID the UUID to be tested
    * @param roomId
    * @return true if the user is the super admin of the party
    */
    isSuperAdmin(playerUUID, roomId) {
        let pa = this.getParty(roomId);

        if(pa && pa.players && pa.players[playerUUID] != undefined && pa.players[playerUUID] && pa.players[playerUUID].is_main_user)
            return true;
        return false;
    }


    /**
    * Put the next sentence into the array
    * @param p the party
    */
    generateNextSentence(p) {
        while(true) {
            let r = Math.round(Math.random() * this.sentences.length) - 1;
            if(!p.game.sentences_id_done.includes(r) && this.sentences[r]) {
                p.game.current_sentence = this.sentences[r];
                p.game.sentences_id_done.push(r);
                return;
            }
        }
    }

    /**
    * Handle a user answer
    * @param playerUUID User global UUID
    * @param socketId SocketIo ip
    * @param roomId Id of the party
    * @param answer String value of the answer
    * @param socket the listening socket
    */
    handleUserAnswer(playerUUID, socketId, roomId, answer, socket) {
        // error
        let p = this.getParty(roomId);
        if(!p || p.players[playerUUID] == undefined || !p.began || p.finished) {
            socket.emit('game_answer_response', "Your game party is unknown or finished, or you are not part of this game.", true);
            return;
        }


        // handle possible errors
        if(p.game.current_round_id == 0) { // filled question
            if(!answer || answer.__proto__.constructor.name != "String") {
                socket.emit('game_answer_response', "Your answer is incorrect.", true);
                return;
            }

            // check if answer Valid
            let ansSpl = answer.split("$$$");
            if(ansSpl.length != p.game.current_sentence.split("$$$").length - 1) {
                socket.emit('game_answer_response', "The original sentence changed.", true);
                return;
            }
            for (let i = 0; i < ansSpl.length; i++) {
                if(
                       ansSpl[i].length < this.config.chars_per_hole.min
                    || ansSpl[i].length > this.config.chars_per_hole.max
                ) {
                    socket.emit(
                        'game_answer_response',
                        `Your answer must contain a minimum of ${this.config.chars_per_hole.min} and a maximum of ${this.config.chars_per_hole.max} chars per hole.`,
                        true
                    );
                    return;
                }
            }
        }
        else { // vote page
            // check if error
            if(!answer || isNaN(answer) || parseInt(answer) < 0 || parseInt(answer) > p.config.next_player_uuid - 1) {
                socket.emit('game_answer_response', "Your answer is incorrect.", true);
                return;
            }

            p.game.current_fastest_id   .push(p.players[playerUUID].uuid);
            p.game.current_popular_votes.push(parseInt(answer));
        }


        // valid answer
        let cr = p.game.current_round;
        p.players[playerUUID].last_answer = answer;
        p.players[playerUUID].last_answer_round = p.game.current_round_id;
        socket.emit('game_answer_response', "Valid answer.", false, 1);

        // next round ?
        let rt = 0;
        let arr = Object.keys(p.players);
        for (let i = 0; i < arr.length; i++)
            if(p.players[arr[i]].last_answer_round == p.game.current_round_id)
                rt++;

        if(rt >= arr.length) {
            if(p.game.current_round_id == 1) {
                this.calculatePoints(p);

                p.game.current_fastest_id    = [];
                p.game.current_popular_votes = [];

                this.generateNextSentence(p);
                p.game.current_round++;
            }

            p.game.current_round_id = (p.game.current_round_id + 1) % 2;
            socket.emit('game_reload');
            socket.broadcast.to(p.id).emit('game_reload');
        }
    }


    /**
    * Calculates the news points of every player
    * @param p the party
    */
    calculatePoints(p) {
        // FASTEST
        let kPlayer = Object.keys(p.players);

        for (let i = 0; i < p.game.current_fastest_id.length; i++)
            for (let j = 0; j < kPlayer.length; j++)
                if(p.players[kPlayer[j]].uuid == p.game.current_fastest_id[i]) {
                    p.players[kPlayer[j]].points.fastest += p.points.fastest(kPlayer.length, i, this.config);
                    break;
                }



        // BEST ANSWER
        let tmpObj = {};
        for (let i = 0; i < p.game.current_popular_votes.length; i++) {
            if(tmpObj[p.game.current_popular_votes[i]])
                tmpObj[p.game.current_popular_votes[i]] += 1;
            else
                tmpObj[p.game.current_popular_votes[i]] = 1;
        }

        let tmpObjK = Object.keys(tmpObj);
        tmpObjK.sort(function(a, b) { return b-a });  // best_uuid, second best_uuid, ...

        let finalScore = {};
        let counter = 1;

        while(tmpObjK.length > 0) {
            let bestScore = -1;
            let objWithBestScore = [];

            // the current best goes in array
            for (let i = 0; i < tmpObjK.length; i++) {
                if(tmpObj[tmpObjK[i]] > bestScore) {
                    objWithBestScore = [tmpObjK[i]];
                    bestScore = tmpObj[tmpObjK[i]];
                }
                else if(tmpObj[tmpObjK[i]] == bestScore)
                    objWithBestScore.push(tmpObjK[i]);
            }
            // they get added in finalScore and are removed from tmpObjK
            finalScore[counter] = objWithBestScore;
            counter += objWithBestScore.length;

            let redo = true;
            while(redo) {
                redo = false;
                for (let i = 0; i < tmpObjK.length; i++) {
                    if(objWithBestScore.includes(tmpObjK[i])) {
                        tmpObjK.splice(i, 1);
                        redo = true;
                    }
                }
            }
        }

        let tmpFScoresK = Object.keys(finalScore);
        let highest = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < tmpFScoresK.length; i++) {
            if(tmpFScoresK[i] > highest)
                highest = tmpFScoresK[i];
        }

        for (let i = 0; i < highest + 1; i++) {
            if(finalScore[i]) {
                for (let j = 0; j < finalScore[i].length; j++) {
                    let score = p.points.best(kPlayer.length, i, this.config);

                    for (let k = 0; k < kPlayer.length; k++)
                        if(p.players[kPlayer[j]].uuid == finalScore[i][j]) {
                            p.players[kPlayer[j]].points.popular += score;
                            break;
                        }
                }
            }
        }
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
            id : "r_" + token,
            began : false,
            finished : false,
            config : { // default and minimal config if any bug occurs
                round_count : 1,
                next_player_uuid : 0
            },
            players : {
                // "global_uuid_xxx" : {
                //     uuid : 0,
                //     pseudo : "xxxx",
                //     global_uuid : "xxxx",
                //     socket_ip : "xxxx",
                //     last_answer : "",
                //     last_answer_round_id : -1,
                /** @TODO implement the next line */
                //     points : {
                //          fastest : 0,
                //          popular : 0
                //     },
                //     is_main_user : false,
                //     results_shown : false
                // }
            },
            game : {
                created_timestamp : Date.now(),     // in milliseconds
                current_round : 0,                  // first round is 1
                current_round_id : 0,               // 0 for answering and 1 for voting
                current_sentence : "",
                current_fastest_id : [],
                current_popular_votes : [],
                sentences_id_done : []
            },
            points : {
                best : function(players_count, p_rank) {
                    return (players_count - p_rank + 1) * 50;
                },
                fastest : function(players_count, p_rank, config) {
                    return this.best(players_count, p_rank) / config.points.fastest_N;
                }
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
    * Delete all party that were created more than x time ago
    */
    cleanSpace() {
        for (let i = 0; i < this.party_list.length; i++)
            if(Date.now() - this.party_list[i].game.created_timestamp > this.config.max_party_duration)
                this.deleteParty(this.party_list[i])
    }



    /**
    * Check the config integrity and handle it
    * @param b the req.body parameters
    * @return true if values are OK and integrity is verified
    */
    handleConfig(b) {
        if(
               !b.room_id
            || !b.round_count || isNaN(b.round_count)
            || parseInt(b.round_count) < this.config.rounds.min || parseInt(b.round_count) > this.config.rounds.max
        ) {
            this.party_list.pop();
            this.id_list.pop();
            return false;
        }

        let p = this.getParty(b.room_id);
        if(!p) return false;

        this.config.round_count = parseInt(b.round_count);

        return true;
    }




    /**
    * @param p the party
    * @return all informations (for player sentences answers) allowed to be given to any client (delete all ip adress)
    */
    getOPlayerInfos(p) {
        let tmp = {};

        let pl = Object.keys(p.players);
        for (let i = 0; i < pl.length; i++) {
            let answ = "";
            let gameSplS = p.game.current_sentence.split("$$$");
            let lastSplS = p.players[pl[i]].last_answer.split("$$$");
            for (let i = 0; i < gameSplS.length * 2 - 1; i++) {
                if(i % 2 == 0) answ += gameSplS[i / 2];
                else           answ += "____b____" + lastSplS[Math.round(i / 2) - 1] + "____b____";
            }

            tmp[p.players[pl[i]].uuid] = {
                uuid: p.players[pl[i]].uuid,
                pseudo: p.players[pl[i]].pseudo,
                answer: answ
            };
        }

        return tmp;
    }

    /**
    * @param p the party
    * @return all informations to calculate the total points allowed to be given to any client (delete all ip adress)
    */
    getOPlayerScores(p) {
        let tmp = {};

        let pl = Object.keys(p.players);
        for (let i = 0; i < pl.length; i++) {
            tmp[p.players[pl[i]].uuid] = {
                uuid: p.players[pl[i]].uuid,
                pseudo: p.players[pl[i]].pseudo,
                points: p.players[pl[i]].points
            };
        }

        return tmp;
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



function runSocket(server, cookie_parser) {
    let io = require('socket.io').listen(server);


    // On a new client is connected
    io.sockets.on('connection', function(socket) {
        // Handle cookies
        let cookies = cookie_parser.parse(socket.handshake.headers.cookie);
        let uuid = cookies._gameUUID;

        if(!uuid) return;

        gameInstance.handleAdress(uuid, socket);

        socket.on('join_room', function(room, isMainUser) {
            gameInstance.joinPlayerTo(uuid, socket.id, room, isMainUser, socket);
        });

        socket.on('user_answer', function(roomId, ans) {
            gameInstance.handleUserAnswer(uuid, socket.id, roomId, ans, socket);
        });
    });

    return io;
}





/* ====== SOCKET IO EXPORT ====== */
module.exports = {
    runSocket: runSocket,
    party    : GameParty
};
