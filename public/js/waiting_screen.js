socket.on('connect', function() {
    if(room != "")
        socket.emit('join_room', room);
});

socket.on('game_reload', function() {
    document.location.reload();
});

socket.on('new_player', function(player_total_count) {
    alert(`A new player has come. Total player count is now ${player_total_count}.`);
});

window.onload = function() {
    if(isSuperAdmin) {
        document.getElementById('submit_button').style.display = 'unset';
        document.getElementById('cancel_button').style.display = 'unset';
    }

    if(error && parseInt(error) == 1)
        alert(`You must be a minimum of ${min_players} and a maximum of ${max_players} in order to play.`);
};
