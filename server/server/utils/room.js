require('../server'); // we import everything on the server on top of here
const db = require("./db"); // we import the db script aswell

// defining global variables
var rooms = [];
var maxScore = 450;
var turnTime = 80000;
var restTime = 5000;
var chooseWordTime = 15000;
var hintTime = 45000;
var rounds = 10;
var minPlayers = 2;

// this is the class for rooms
class Room {
    // the cunstructor
    constructor (id) {
        // defining attributes
        this.id = id;
        this.justCreated = true;
        this.word = 'Wating...';
        this.howManyGuessed = 0;
        this.onlinePlayers = [];
        this.voteKicks = 0;
        this.whosTurn = 0;
        this.turnRunning = false;
        this.currentRound = rounds;
        this.isFull = false;
        this.roundTimer;
        this.hintTimout;
        this.sendSuggestionsSetTimout;
        this.resetTurnSetTimout;
        this.choosenSuggestions = [];
        this.justReseted = false;
        console.log('Room created');
    }
    // defining methods
    // this method will add a new player to the list of players under this class
    addToOnlinePlayers (player) {
        console.log('addToOnlinePlayers');
        this.onlinePlayers.push(player);
        this.sendUpdatePack();
        this.checkStart();
    }
    // this is a method for check if room started or not
    checkStart () {
        console.log('checkStart');
        if(this.onlinePlayers.length >= minPlayers) {//  && this.justCreated === true
            this.beforeRound(); // jumps to the next step
            this.justCreated = false;
        }
    }
    // this is an asynced method that happenes before each round, it is asynced because it uses database and doesnt know when the resault will back, so it basically wait then go nest method
    async beforeRound () { // LoopStart
        console.log('BeforeRound');
        if(this.whosTurn !== 0)
            return;
        this.chooseWhosTurn();
        this.sendWhosTurn();
        this.choosenSuggestions = await db.getWords();
        this.sendSuggestions();
    }
    // this method choose one of the players online in this room as the one whos turn it is
    chooseWhosTurn () {
        try {
            console.log('chooseWhosTurn');
            let randomIndex = randomNumber(0, this.onlinePlayers.length); // TODO check currection
            this.whosTurn = this.onlinePlayers[randomIndex].id;
            this.onlinePlayers[randomIndex].turn = true;
        } catch (exception) {
            forceDeleteRoom(this);
        }
    }
    // this method send everyone on the room and tell them whos turn it is
    sendWhosTurn () {
        console.log('sendWhosTurn');
        broadCastToRoom(this.id, {state: 'whosTurn', id: this.whosTurn}); // TODO client side UI change
        return;
    }
    // this method will send 3 word suggestions that we got from database before and send it to the player whos turn it is
    sendSuggestions () {
        console.log('sendSuggestions');
        sendToPlayer(this.whosTurn, {state: 'wordSuggestions', suggestions: this.choosenSuggestions});
        let _this = this;
        this.sendSuggestionsSetTimout = setTimeout(function() { // finishes the turn
            if(_this.word === 'Loading...') {
                _this.resetTurn();
            }
        }, chooseWordTime);
    }
    // this method is no longer used, it was for when we had no database
    // choose3words () {
    //     console.log('choose3words');
    //     let randomIndex = randomNumber(0, savedWords.length - 1);
    //     this.choosenSuggestions = savedWords[randomIndex];
    //     return this.choosenSuggestions;
    // }

    // this method will happen whenever the player whos turn it is chooses one of the 3 sent words
    wordChosen (id, word) {
        console.log('wordChosen');
        var check = this.checkwordWalidation(word);
        if(check === false) {
            console.log('Kicked'); // TODO test
            // this.onlinePlayers.splice(this.onlinePlayers.findIndex(player => player.id === this.whosTurn), 1);
            SOCKET_LIST[this.whosTurn].disconnect();
            return;
        }
        // if(this.onlinePlayers.find(x => x.id === this.whosTurn) != undefined) { // TODO test
        this.onlinePlayers.find(x => x.id === this.whosTurn).allowDraw = true;
        sendToPlayer(id, {state: 'allowDraw', allowDraw: true});
        this.startRound();
        // }
    }
    // this will check if the word that the player choosed is valid or not, this actually prevent cheaters and hackers to send wrong information over the specific socket line
    checkwordWalidation (word) {
        console.log('checkwordWalidation');
        this.word = this.choosenSuggestions.find(x => x === word);
        if(this.word === word) {
            return true;
        }
        return false;
    }
    // this will start the round by telling everyone on the room about the word length and empty lines and starts the game by starting some timers for hint and for the hole round time
    startRound () {
        console.log('startRound');
        let _this = this;

        broadCastToRoom(this.id, {state: 'roundStarted', emptyLines: this.word.length, spaceIndex: this.word.indexOf(' ')});
        this.sendUpdatePack();
        this.turnRunning = true;

        this.roundTimer = setTimeout(function() { // finishes the turn
            if(_this.decreaseRound() === false)
                _this.resetTurn();
        }, turnTime);

        this.hintTimout = setTimeout(function() { // gives a hint
            var randomChatIndex = randomNumber(0, _this.word.length);
            if(_this.word.charAt(randomChatIndex) === ' ') {
                randomChatIndex ++;
            }
            console.log('hint ' + randomChatIndex);
            broadCastToRoomExceptThePlayer(_this.whosTurn, _this.id, {state: 'hint', index: randomChatIndex, char: _this.word.charAt(randomChatIndex), spaceIndex: _this.word.indexOf(' ')});
        }, hintTime);
    }
    // this will decrease the number of rounds after each round is done
    decreaseRound() {
        console.log('decreaseRound');
        this.currentRound--;
        if(this.currentRound === 0) {
            this.reset();
            return true;
        }
        return false;
    }
    // this will notify all players on the room that the round or final round is finished
    sendRoundFinished () {
        console.log('sendRoundFinished');
        if(this.currentRound > 0) {
            broadCastToRoom(this.id, {state: 'roundFinished', word: this.word});
        } else {
            broadCastToRoom(this.id, {state: 'finalRoundFinished', word: this.word});
        }
    }
    // this will send the information about scores and all the players updated information
    sendUpdatePack () {
        var pack = [];
        for(let i = 0; i < this.onlinePlayers.length; i++) {
            pack.push([this.onlinePlayers[i].name, this.onlinePlayers[i].tempScore, this.onlinePlayers[i].score, this.onlinePlayers[i].guessed, this.onlinePlayers[i].allowDraw, this.onlinePlayers[i].avatar]);
        }
        broadCastToRoom(this.id, {state: 'updatePack', pack, currentRound: this.currentRound});
    }
    // this will calculate the score after each round
    calculateTurnScores () {
        console.log('calculateTurnScores');
        for(var i = 0 ; i < this.onlinePlayers.length ; i++) {
            var player = this.onlinePlayers[i];
            if(player.id !== this.whosTurn) {
                player.score += player.tempScore;
                // player.tempScore = 0;
            } else {
                var tempScoreForWhosTurn = Math.round(maxScore / (this.onlinePlayers.length - 1));
                player.score += (tempScoreForWhosTurn * this.howManyGuessed);
            }
        }
    }
    // this will reset a round/turn
    resetTurn () { // LoopEnd
        console.log('resetTurn');
        try{
            this.calculateTurnScores();
            this.sendUpdatePack();
            this.sendRoundFinished();
            this.resetPlayersInTurn();
            this.word = 'Loading...';
            this.howManyGuessed = 0;
            this.voteKicks = 0;
            this.whosTurn = 0;
            this.turnRunning = false;
            this.roundTimer;
            this.hintTimout;
            this.choosenSuggestions = [];
            clearTimeout(this.roundTimer);
            clearTimeout(this.sendSuggestionsSetTimout);
            clearTimeout(this.resetTurnSetTimout);
            clearTimeout(this.hintTimout);
            
            let _this = this;
            this.resetTurnSetTimout = setTimeout(function() {
                console.log('endRound');
                clearTimeout(_this.resetTurnSetTimout);
                _this.beforeRound(); // loop again
            }, restTime);
        } catch(exception) { console.log(exception); }
    }
    // this will reset the hole game after the last round, but it wont kick players
    reset () {
        console.log('reset');
        try{
            this.calculateTurnScores();
            this.sendUpdatePack();
            this.sendRoundFinished();
            this.resetPlayers();
            this.justCreated = true;
            this.word = 'Loading...';
            this.howManyGuessed = 0;
            this.voteKicks = 0;
            this.whosTurn = 0;
            this.turnRunning = false;
            this.currentRound = rounds;
            this.isFull = false;
            this.roundTimer;
            this.hintTimout;
            this.choosenSuggestions = [];
            this.justReseted = true;
            clearTimeout(this.roundTimer);
            clearTimeout(this.sendSuggestionsSetTimout);
            clearTimeout(this.resetTurnSetTimout);
            clearTimeout(this.hintTimout);

            let _this = this;
            this.resetTurnSetTimout = setTimeout(function() {
                console.log('endAnFinishiedAllRounds');
                clearTimeout(_this.resetTurnSetTimout);
                _this.checkStart(); // loop again
                //_this.beforeRound(); // loop again
                _this.justReseted = false;
            }, restTime);
        } catch(exception) { console.log(exception); }
    }
    // this will clear all the timouts currently started up
    clearAllTimouts() {
        clearTimeout(this.roundTimer);
        clearTimeout(this.sendSuggestionsSetTimout);
        clearTimeout(this.resetTurnSetTimout);
        clearTimeout(this.hintTimout);
    }
    // this will reset all the players information and set them back to default
    resetPlayers () {
        console.log('resetPlayers');
        for(var i = 0 ; i < this.onlinePlayers.length ; i++) {
            var player = this.onlinePlayers[i];
            player.reset();
        }
    }
    // this will reset all the players information except the score and stuff of them
    resetPlayersInTurn () {
        console.log('resetPlayersInTurn');
        for(var i = 0 ; i < this.onlinePlayers.length ; i++) {
            this.onlinePlayers[i].resetPlayersInTurn();
        }
    }
    // this will happen whenever someone guess something or even chat
    guessed(player, guess) {
        console.log('guessed');
        if(player.guessed === false && guess === this.word && player.id !== this.whosTurn) {
            this.howManyGuessed++; // important to be the first otherwise we will have divide by 0
            player.guessed = true; 
            player.tempScore = Math.floor(maxScore/this.howManyGuessed);
            sendToPlayer(player.id, {state:'rightGuess', word: this.word});
            broadCastToRoom(this.id, {state:'guess', name: player.name, guess: ' - GUESSED -' + player.tempScore, guessed: player.guessed});
            if(this.howManyGuessed === this.onlinePlayers.length - 1) {
                this.decreaseRound();
                this.resetTurn();
            } else {
                this.sendUpdatePack();
            }
        } else {
            if(guess !== this.word)
                broadCastToRoom(this.id, {state:'guess', name: player.name, guess, guessed: player.guessed}); // guess acts as chat
        }
    }
    // this will happen whenever some one hits the kicks button
    votedForKick (player) {
        console.log('votedForKick');
        if(player.id === this.whosTurn || this.turnRunning === false || player.voteKick === true) {
            return;
        }
        player.voteKick = true;
        this.voteKicks++;
        if(this.voteKicks > Math.floor(this.onlinePlayers.length/2)) { // one more than half, more than 3 players
            SOCKET_LIST[this.whosTurn].disconnect();
        }
    }
    // thiss will happen when somebody leaves
    someoneLeaved (leaverId) {
        console.log('someoneLeaved');
        this.sendUpdatePack();

        // if only one player remains
        if(this.onlinePlayers.length === 1) {
            this.reset();
            return;
        }
        
        // if more than one player remains and it was the leavers turn
        if(leaverId === this.whosTurn && this.onlinePlayers.length > 0) {
            this.decreaseRound();
            this.resetTurn();
            return;
        } else { // if more than one player remains and it was not the leavers turn
            this.sendUpdatePack();
        }
        
        if(this.onlinePlayers.length < 1) {
            console.log('rooms empty');
        }
        return;
    }
    
}

// some handy functions
// this will give you a random number between two numbers, except it will never return the max number, if you wanna do that you should add +1 at the end of formula
var randomNumber = (min, max) => { // even negative numbers are supported
    return Math.floor(Math.random() * (max - min) + min);
}

var sendToPlayer = (id, data) => {
    try {
        SOCKET_LIST[id].emit('private', data);
    } catch (exception) {
        console.log(exception);
    } 
}
// this will broadcast something to everyone on the room
var broadCastToRoom = (roomId, data) => {
    try {
        io.in(roomId + '').emit('roomBroadCast', data);
    } catch (exception) {
        console.log(exception);
    } 
}
// this will broadcast something to everyone on the room except the player that sends the data
var broadCastToRoomExceptThePlayer = (id, roomId, data) => {
    try {
        SOCKET_LIST[id].to(roomId + '').emit('roomBroadCastExc', data);
    } catch (exception) {
        console.log(exception);
    } 
}
// this will broadcast something to everyone on the hole game
var broadCastToAll = (data) => {
    try {
        io.emit('globalBroadCast'. data);
    } catch (exception) {
        console.log(exception);
    } 
}
// this will broadcast something to everyone on the hole game except the player who sends the data
var broadCastToAllExceptThePlayer = (id, data) => {
    try {
        SOCKET_LIST[id].broadcast.emit('globalBroadCastExc', data);
    } catch (exception) {
        console.log(exception);
    } 
}
// we export some of above functions/classes/variables in orter to be used in other pages
module.exports = {rooms, Room};