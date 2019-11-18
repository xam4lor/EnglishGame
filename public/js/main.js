socket.on('redirect_user', function(dest) {
    window.location.href = dest;
});

function connect() {
    window.location.href = "/game/waiting?room_id=" + document.getElementById('gamePin').value;
}

if(error == 1) {
    alert("The room in which you tried to enter in was full");
}
