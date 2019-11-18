window.onload = function() {
    let allCount = Object.keys(pScores);

    let liEl = document.getElementById('scores_show');
    for (let i = 0; i < allCount.length; i++) {
        let itemLi = document.createElement('li');

        itemLi.appendChild(document.createTextNode("Player " + pScores[allCount[i]].uuid + " : ")); /** @TODO : display pseudos here */
        itemLi.appendChild(document.createTextNode("  Total : " + Math.round(pScores[allCount[i]].points.fastest + pScores[allCount[i]].points.popular)));
        itemLi.appendChild(document.createTextNode("  Score popular : " + Math.round(pScores[allCount[i]].points.popular)));
        itemLi.appendChild(document.createTextNode("  Score fastest : " + Math.round(pScores[allCount[i]].points.fastest)));

        liEl.appendChild(itemLi);
    }
}
