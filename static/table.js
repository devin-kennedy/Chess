var whiteLastMoves;

function onDragStart(source, piece, position, orientation) {
    if (chess.game_over()) return false;

    if ((chess.turn() === "b" && piece.search(/^w/) !== -1) || (chess.turn() === "w" && piece.search(/^b/) !== -1)){
        return false;
    }
}

function onDrop(source, target, piece, newPos, oldPos, orientation) {
    var take = isTake(target);

    var move = chess.move({
        from: source,
        to: target,
        promotion: "q"
    });
    // Illegal move handling
    if (move === null) {
        return "snapback";
    }

    //Engine
    if (chess.turn() === "b") {
        Engine(newPos, whiteLastMoves);
    } else {
        whiteLastMoves = chess.moves({verbose: true});
    }

    updateStatus();
}

// Weird chess rule moves handling
function onSnapEnd() {
    board.position(chess.fen());
}

function updateStatus() {
    var moveColor = "White";
    if (chess.turn() === "b") {
        moveColor = "Black";
    }

    if (chess.in_checkmate()){
        document.getElementById("status").innerHTML = moveColor + " is now in checkmate. Game Over";
    } else if (chess.in_draw()) {
        document.getElementById("status").innerHTML = "The game has reached a draw";
    } else {
        document.getElementById("status").innerHTML = moveColor + " to move";
    }

    document.getElementById("pgnOut").innerHTML = chess.pgn();
}

function isTake(target) {
    var targetSquare = chess.get(target);
    if (targetSquare) {
        return targetSquare['type'];
    }
    return false;
}

function parsePGN(pgn) {
    var pgnArray = pgn.split(" ");
    for (i=0; i<pgnArray.length; i++) {
        var item = pgnArray[i];
        if (item.split(".").length > 1) {
            pgnArray[i] = item.split(".")[1]
        }
    }
    return pgnArray
}

function fromPGN(pgn) {
    if (pgn === "") {
        pgn = window.prompt("Enter your PGN moves", "");
    }
    reset();
    var parsedPGN = parsePGN(pgn);
    for (i=0; i<parsedPGN.length; i++) {
        var movePGN = parsedPGN[i];
        var move = chess.move(movePGN);
        if (move === null) {
            window.alert("Invalid PGN given");
            reset();
            return
        }
        board.position(chess.fen())
        updateStatus();
    }
}

//Engine: GPT
function engineMove(move) {
    chess.move(move);
    board.position(chess.fen());
    updateStatus();
}

function reset() {
    board.start();
    document.getElementById("status").innerHTML = "White to move";
    chess.reset();
    bMaterial = 39;
    wMaterial = 39;
    updateStatus();
}

async function GPTEngine() {
    var board = chess.board();
    console.log("call");
    var xReq = new XMLHttpRequest();
    xReq.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            let response = this.responseText;
            let convertedJSON = JSON.parse(response);
            engineMove(convertedJSON["response"]);
            updateStatus();
        } else {
            console.log("Bad request");
            console.log(this.responseType);
        }
    }
    const url = "https://enginetest.llaamaguy.repl.co/";
    xReq.open(
        "POST",
        url,
        true
    )
    xReq.setRequestHeader("Content-Type", "application/json");
    xReq.setRequestHeader("Access-Control-Allow-Origin", "http://localhost:63342");
    var toSend = {history: chess.pgn().toString()};
    toSend = JSON.stringify(toSend);
    xReq.send(toSend);
}

async function Engine(pos, formerMoves) {
    console.log("call");
    var xReq = new XMLHttpRequest();
    xReq.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            let response = this.responseText;
            let convertedJSON = JSON.parse(response);
            engineMove(convertedJSON["response"]);
            updateStatus();
            updateEval(convertedJSON["eval"]);
            set_eval_bar(calculate_eval_bar_bounds(convertedJSON["eval"]));
        } else {
            console.log("Bad request");
            console.log(this.responseType);
        }
    }
    const url = "https://enginetest.llaamaguy.repl.co/";
    xReq.open(
        "POST",
        url,
        true
    )
    xReq.setRequestHeader("Content-Type", "application/json");
    xReq.setRequestHeader("Access-Control-Allow-Origin", "http://localhost:63342");
    var legalMoves = chess.moves({verbose: true});

    //for (i=0; i<legalMoves.length; i++) {
        //var thisMove = legalMoves[i];
        //thisMove["isAttacked"] = chess.isAttacked(thisMove["to"], Chess.BLACK);
    //}
    var toSend = {position: pos, moves: legalMoves, formerMoves: formerMoves};
    console.log(toSend);
    toSend = JSON.stringify(toSend);
    xReq.send(toSend);
}

function updateEval(eval) {
    document.getElementById("eval").innerHTML = "Eval: " + eval.toString()
}

function calculate_eval_bar_bounds(eval) {
    eval = parseFloat(eval);

    if (eval !== 0.0) {
        var whiteHeight = 250 + (100 * (2.4 * Math.tanh(0.05 * eval)));
        var blackHeight = 500 - whiteHeight;

        console.log("EVAL CALCULATIONS");
        console.log(eval);
        console.log(whiteHeight);
        console.log(blackHeight);
        return [whiteHeight, blackHeight];
    } else {
        return [250, 250];
    }

}

function set_eval_bar(bounds) {
    document.getElementById("whiteEval").style.height = bounds[0].toString()+"px";
    document.getElementById("blackEval").style.height = bounds[1].toString()+"px";
}

var config = {
    position: "start",
    pieceTheme: "/static/alphaIcons/{piece}.svg",
    orientation: "white",
    dropOffBoard: "snapback",
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}

// Initializations
var board = Chessboard("myBoard", config);
const chess = new Chess();
whiteLastMoves = chess.moves({verbose: true});

// JQuery Onclick listeners
$().resize(board.resize);
$("#resetBoard").on("click", reset);
$("#fromPgn").on("click", function (){
    fromPGN("");
});
$("#bookOpenScotch").on("click", function (){
    fromPGN("1.e4 e5 2.Nf3 Nc6 3.d4");
    Engine(board.position(), whiteLastMoves);
});
$("#resetBoard").on("click", function() {
   document.getElementById("eval").innerHTML = "Eval: 0.0";
   document.getElementById("blackEval").style.height = "250px";
   document.getElementById("whiteEval").style.height = "250px";
});

document.getElementById("status").innerHTML = "White to move";
document.getElementById("eval").innerHTML = "Eval: 0.0";