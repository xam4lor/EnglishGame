socket.on('connect', function() {
    if(room != "")
        socket.emit('join_room', room);
});

socket.on('game_reload', function() {
    document.location.reload();
});

socket.on('game_answer_response', function(message, error, code) {
    if(error) {
        alert('Error :' + message);
        console.error(message);
    }
    else {
        console.log(message);

        document.getElementById("answerSubmitted").style.opacity = "1";

        if(code == 1)
            alert('Waiting for the others to answer...');
    }
});


var inputArr = [];

function submitAnswer() {
    let ans = "";
    for (let i = 0; i < inputArr.length; i++) {
        ans += inputArr[i].value;
        if(inputArr[i + 1])
            ans += "$$$";
    }

    socket.emit('user_answer', room, ans);
    // ans = "first hole sentence $$$ second hole sentence"
}

window.onload = function() {
    let splSentence = current_sentence.split("$$$");
    let container = document.getElementById('sentence-container');

    for (let i = 0; i < splSentence.length; i++) {
        let p = document.createElement("p");
        p.innerHTML = splSentence[i];
        container.appendChild(p);

        if(i < splSentence.length - 1) {
            let inp = document.createElement("input");
            container.appendChild(inp);
            inputArr.push(inp);
        }
    }
};
