let historyElement = document.getElementById('moves-list'); //select the element
const outcomeModal = document.getElementById('modal');
const youScore = document.getElementById('you-score');
const AIScore = document.getElementById('ai-score');
const closeButtonModal = document.getElementById('close');
const WHITE_VICTORY = "whiteVictory";
const BLACK_VICTORY = "blackVictory";
const STALEMATE_BY_INSUFFICIENT_MATERIAL = "Stalemate By Insufficient Material";
const STALEMATE_BY_REPETITION = "Stalemate By Repetition";
const optionalModalText = document.getElementById('optional');

//////////////// store current state /////////////////////
//////////////////////////////////////////////////////////

let state = {
    you: 0,
    ai: 0,
    color: null,
    depth: 0,
    supportedDepths: [1,2,3,4]
}
let move = 0;
let moveCount = 0;
 // flag to check which player's turn it is to move
let board,
  game = new Chess();

//
// drag only white pieces, and stop the game when either one wins, 
// or if stalemate occurs
function onDragStart(source, piece, position, orientation) {
    let isAIPieceStrengthZero;
    if (state.color === "white") {
        isAIPieceStrengthZero = (piece.search(/^b/) !== -1);
    }
    else {
        isAIPieceStrengthZero = (piece.search(/^w/) !== -1)
    }
    if (game.game_over() || isAIPieceStrengthZero) {
        return false;
    }
    return true;
}

function onDrop(source, target) {
  // see if the move is legal
  let move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });
  /*
  illegal move if the move variable is null
  it will immediately detect the error cases and return null for:
  1. when move object has color: w, which means previous move was white's
  2. when player clicked on his own piece square, but he did not move it
  3. when player clicked on opponent's piece(s)
  4. when player clicked on his own piece but moved it to an invalid square,
    e.g., moving the bishop on a straight file, moving rook diagonally, or even 
          trying to move a piece to a square that is already occupied
    */
   
   if (move === null) {
    return 'snapback';
   }
   //renderWhiteMoveHistory(game.history());
   window.setTimeout(makeBestMove, 250); //make random computer move after 250 ms
}
/*
Need this function since the board position needs to be updated for moves that don't
follow the normal piece behaviour, such as en passant, piece promotion, and castling
we can move the king two squares with the onDrop function
but we'll need to update the fen to the board in order to move the rook two places too
*/
function onSnapEnd () {
    board.position(game.fen())
}

/* The AI */

// get the piece value of a particular square
/*
pawn - type: p, value: 1
knight - type: n, value: 3
bishop - type: b, value: 3
rook - type: r, value: 5
queen - type: q, value: 9
king - type: k, value: 1000 (can be any number really)
*/
function getPieceValue(piece) {
    let pieceValue = 0;
    if (!piece) {
        // if current square does not have any piece
        return pieceValue;
    }
    if (piece.type === 'p') {
        pieceValue = 1
    }
    else if (piece.type === 'n') {
        pieceValue = 3;
    }
    else if (piece.type === 'b') {
        pieceValue = 3;
    }
    else if (piece.type === 'r') {
        pieceValue = 5; 
    }
    else if (piece.type === 'q') {
        pieceValue = 9;
    }
    else {
        pieceValue = 1000;
    }

    //diff between black and white (I'm not racist, chess is)
    return (piece.color === 'w') ? Math.abs(pieceValue) : - Math.abs(pieceValue);    
}

// get the full board eval from 8x8 2D array
function getBoardEvaluation(board) {
    let totalEvaluation = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(board[i][j]);
        }
    }
    return totalEvaluation;
}

/* Minimax Algorithm */
// This is the main function

function minimax(game, depth, isMaximized) {
    let nextBoardMoves = game.ugly_moves();
    let nextPossibleMove = undefined;
    let bestScore = -Infinity;
    let bestMovePossible = undefined;
    for (let i = 0; i < nextBoardMoves.length; i++) {
        nextPossibleMove = nextBoardMoves[i]; 
        game.ugly_move(nextPossibleMove);
        // calculate the best value after recursing through all possible moves
        let value = minimax2(game, depth-1, !isMaximized, 1000, -1000); // returns a score
        game.undo();
        if (value >= bestScore) {
            bestScore = value;
            bestMovePossible = nextPossibleMove;
        } 
    }
    return bestMovePossible;
}

/////////////////////////////////////////////////////////////////////////
/////////////////// Helper Functions for recursive call /////////////////
/////////////////////////////////////////////////////////////////////////

let minimax2 = function (game, depth, isMaximized, alpha, beta) {
    if (!depth) {
        return getBoardEvaluation(game.board());
    }
    let nextBoardMoves = game.ugly_moves();
    if (isMaximized) {
        let bestPossibleMove = Infinity;
        for (let i = 0; i < nextBoardMoves.length; i++) {
            game.ugly_move(nextBoardMoves[i]);
            bestPossibleMove = Math.min(bestPossibleMove, minimax2(game, depth - 1, !isMaximized, alpha, beta));
            game.undo();
            alpha = Math.min(alpha, bestPossibleMove);
            if (alpha <= beta) {
                //prune the tree
                return bestPossibleMove;
            }
        }
        return bestPossibleMove;
    } 
    else {
        let bestPossibleMove = -Infinity;
        for (let i = 0; i < nextBoardMoves.length; i++) {
            game.ugly_move(nextBoardMoves[i]);
            bestPossibleMove = Math.max(bestPossibleMove, minimax2(game, depth-1, !isMaximized, alpha, beta));
            game.undo();
            beta = Math.max(beta, bestPossibleMove);
            if (alpha <= beta) {
                return bestPossibleMove;
            }
        }
        return bestPossibleMove;
    }
};

const moves_list = document.getElementById('moves-list');
// caller function
function makeBestMove() {
    let isMaximized = false;
    if (game.game_over()) {
        //renderGameOutcomeWindow(game);
        return;
    }
    let bestMove = minimax(game, state.depth, isMaximized);
    game.ugly_move(bestMove);
    //update the board
    board.position(game.fen());
    //renderBlackMoveHistory(game.history());    
}

////////////////////////// Move History Table ///////////////
/////////////////////////////////////////////////////////////

function renderWhiteMoveHistory(moves) {
    let innerHTML;
    let currentMove = moves.slice(-1);
    move++;
    innerHTML = `<div class="move" data-move-number="${move}">
    <div class="move-number">${move}.</div>
    <div class="white">${currentMove[0]}</div>
    <div class="black"></div>
    </div>`;
    historyElement.innerHTML += innerHTML;
}

function renderBlackMoveHistory(moves) { 
    let moveTag = Array.from(document.getElementsByClassName('move')).slice(-1)[0];
    let blackClass = moveTag.getElementsByClassName('black')[0];
    let currentMove = moves.slice(-1);
    blackClass.insertAdjacentText('beforeend',`${currentMove[0]}`);
}

function flipBoard() {
}

function resignGame() {
    config.draggable = false;

}

/////////////////////// Render game outcome modal //////////////////
//////////////////////////////////////////////////////////////////////
function closeModal() {
    outcomeModal.style.display = "none";
}

// close the playModal if newgame is pressed or close-btn, but check if the user has selected all the fields prior
// 1. If new-game btn is clicked and fields are selected, create a new game with the selected ones
// 2. If new-game btn clicked and fields are not selected, generate a new game with random choices of depth and color
// 3. If close-btn pressed, don't do anything, just close the modal.
function closePlayModal() {
        // check the state and start a new game depending on those states
    if (state.color === null && state.depth === 0) {
        //random game
        generateRandomGame();
    }
    else {
        createNewGame();
    }
    playModal.style.display = "none";
}

//////////////////////////// generate Random Game //////////////////////////
////////////////////////////////////////////////////////////////////////////
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function generateRandomGame() {
    let randomDepth = randomIntFromInterval(1,state.supportedDepths.length);
    let randomColor = randomIntFromInterval(1,2); //only two colors obviously
    // set the state
    state.color = (randomColor === 1) ? "white" : "black";
    state.depth = randomDepth; 
    // now generate the random game from these states
    createNewGame();
}

function createNewGame() {
    board = ChessBoard('board', config);
    if (state.color === "black") {
        //flip and let AI start first
        board.flip();
        makeBestMove();
    }
} 
function setOutcomeModal(outcome) {
    outcomeModal.style.display = "block";
    if (outcome === WHITE_VICTORY) {
        youScore.textContent = "1";
        AIScore.textContent = "0";
    }
    else if (outcome === BLACK_VICTORY) {
        AIScore.textContent = "1";
        youScore.textContent = "0";
    }
    else {
        youScore.textContent = "1/2";
        AIScore.textContent = "1/2";
        optionalModalText.textContent = `(${outcome})`;
    }
}
function renderGameOutcomeWindow(game) {
    // determine winner or whether stalemate has occurred
    if (game.game_over()) {
        //check for white victory: odd length of moves
        if (game.in_checkmate() && (game.history() % 2 !== 0)) {
            // set the text for establishing a victory for white
            setOutcomeModal(WHITE_VICTORY);
        } //even length of moves for black victory
        else if (game.in_checkmate() && (game.history() % 2 === 0)) {
            // set the text for establishing a victory for black
            setOutcomeModal(BLACK_VICTORY);
        } //stalemate
        else if (game.insufficient_material()) {
            setOutcomeModal(STALEMATE_BY_INSUFFICIENT_MATERIAL);
        }
        else {
            setOutcomeModal(STALEMATE_BY_REPETITION)
        }
    }

}


function onDrop1(source, target) {
    // see if the move is legal
    let move = game.move({
      from: source,
      to: target,
      promotion: "q", // NOTE: always promote to a queen for example simplicity
    });
        
    if (move === null) {
      return 'snapback';
    }
    //renderWhiteMoveHistory(game.history());
    window.setTimeout(makeBestMove, 250); //make random computer move after 250 ms
}

//////////////////////// play Modal Window helpers //////////////////////////////
const playModal = document.getElementById('play-modal');
const colorSelectContainer = document.getElementById('color-select');
const button1 = document.getElementById('button1');
const button2 = document.getElementById('button2');
const depthBtns = document.getElementsByClassName('depth-button');
const closePlayModalButton = document.getElementById('play-close');
const playGame = document.getElementById('Play');
const aboutGame = document.getElementById('About');
const downloadPGN = document.getElementById('download-pgn');
const flipBoardButton = document.getElementById('flip-board-logo');
const resignButton = document.getElementById('resign-logo');
const depthSelectContainer = document.getElementById('depth-select');
const newGameButton = document.getElementById('new-game');

function setDepthDefaults() {
    for (let i = 0; i < depthBtns.length; i++) {
        depthBtns[i].style.backgroundColor = '#363535';
    }
}
function setBackgroundColor(e) {
  let button = e.target.closest("button");
  try {
    if (button.classList.contains("button1")) {
      button.style["background-color"] = "#3CB371"; //seagreen
      button2.style.backgroundColor = "#363535"; //default
      state.color = "white";
    } else if (button.classList.contains("button2")) {
      button.style.backgroundColor = "#3CB371";
      button1.style.backgroundColor = "#363535"; //default
      state.color = "black";
    } else if (
      button.classList.contains("depth-1") ||
      button.classList.contains("depth-2") ||
      button.classList.contains("depth-3") ||
      button.classList.contains("depth-4")
    ) {
      setDepthDefaults(); //first set default grey to all depth buttons
      button.style.backgroundColor = "#3CB371"; //then set the seagreen
      state.depth = button.textContent;
    }
  } catch (error) {
    return;
  }
}

function renderPlayModal() {
    playModal.style.display = "block";
}

function clearBoard() {
    board = ChessBoard('board');
}
let config = {
  draggable: true,
  position: "start",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
};
// flip the board for black //
/////////////////////////////
window.addEventListener('load', clearBoard);
depthSelectContainer.addEventListener('click', setBackgroundColor);
colorSelectContainer.addEventListener('click', setBackgroundColor);
flipBoardButton.addEventListener('click', flipBoard);
resignButton.addEventListener('click', resignGame);
closeButtonModal.addEventListener('click', closeModal);
closePlayModalButton.addEventListener('click', closePlayModal);
newGameButton.addEventListener('click', closePlayModal);
playGame.addEventListener('click', renderPlayModal);