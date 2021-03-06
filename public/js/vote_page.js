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

        if(code == 1)
            alert('Waiting for the others to answer...');
    }
});


function submitAnswer() {
    let ans = document.getElementById('vote_select').value;
    socket.emit('user_answer', room, ans);
    // ans = uuid of the selected player

    document.getElementById("answerSubmitted").style.opacity = "1";
}

window.onload = function() {
    // SELECT AREA
    selEl = document.createElement("SELECT");
    selEl.setAttribute("id", "vote_select");

    let keys = Object.keys(players_answers);
    for (let i = 0; i < keys.length; i++) {
        let pl = players_answers[keys[i]];

        if(pl.uuid == perso_uuid) continue;

        let tOption = document.createElement("option");
        tOption.setAttribute("value", pl.uuid);

        let tNode = document.createTextNode(pl.uuid); /** @TODO : display pseudos here */
        tOption.appendChild(tNode);
        selEl.appendChild(tOption);
    }

    document.getElementById('vote_select_area').appendChild(selEl);


    // SENTENCES LIST AREA
    let liEl = document.getElementById('vote_sentences_list');

    for (let i = 0; i < keys.length; i++) {
        let pl = players_answers[keys[i]];
        let itemLi = document.createElement('li');

        let ansSpl = pl.answer.split("____b____");

        let t = pl.uuid;
        if(pl.uuid == perso_uuid) t += " (you)";
        t += " : ";

        itemLi.appendChild(document.createTextNode(t)); /** @TODO : display pseudos here */
        for (let i = 0; i < ansSpl.length; i++) {
            if(i % 2 == 0)
                itemLi.appendChild(document.createTextNode(ansSpl[i]));
            else {
                let b = document.createElement("b");
                b.innerHTML = ansSpl[i];
                itemLi.appendChild(b);
            }
        }


        liEl.appendChild(itemLi);
    }
};
