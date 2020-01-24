// this is the players class
class Player {
    // the cunstructor
    constructor (id, name, avatar, roomId) {
        // defining attributes
        this.id = id;
        this.roomId = roomId;
        this.name = name;
        this.avatar = avatar;
        this.score = 0;
        this.tempScore = 0;
        this.joined = false;
        this.allowDraw = false;
        this.turn = false;
        this.guessed = false;
        this.voteKick = false;
        this.spammer = false;
        this.spamTime = 5000;
    }
    // this method will reset the players but not scores and some other infos
    resetPlayersInTurn () {
        this.guessed = false;
        this.voteKick = false;
        this.allowDraw = false;
        this.tempScore = 0;
    }
    // this method will reset the player and set everyting back to default
    reset () {
        this.score = 0;
        this.tempScore = 0;
        this.guessed = false;
        this.voteKick = false;
        this.allowDraw = false;
    }
    // this method will be run whenever the player spam chats or spam guess something
    spammed () {
        this.spammer = true;
        let _this = this;
        this.spamTimer = setTimeout(function() {
            _this.spammer = false;
            console.log('SpamFree');
            clearTimeout(_this.spamTimer);
        }, this.spamTime);
    }
}
// we export some of above functions/classes/variables in orter to be used in other pages
module.exports = {Player};