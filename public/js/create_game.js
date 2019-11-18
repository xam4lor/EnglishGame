socket.on('connect', function() {
    if(room != "")
        socket.emit('join_room', room, true);
});
