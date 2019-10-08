let a = 0;
var b = ["t", 0, {test: "test"}];

for (let i = 0; i < array.length; i++) {
    while (true) {
        break;
    }
}

function test(x, y) {
    return 3*y;
}


let a = function(x) {
    return x * 2;
};

//Variables
let p_total_count = 4;
let p_rank =0;
let round_number = 0;
let holes_average = 0;

//Fonctions
function best(p_total_count, p_rank)
{
    return (p_total_count - p_rank + 1) * 50;
}
function fastest(p_total_count, p_rank)
{
    return 1/3 * best(p_total_count, p_rank);
}

let total = (best(p_total_count, p_rank) + fastest(p_total_count, p_rank)) * round_number * holes_average;
