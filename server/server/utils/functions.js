// 
const {rooms, Room} = require('./room'); // using some classes and functions that are defined and exported over the room page
require('../server'); // requiring server on top of here
// defining global variables
var maxPlayers = 8;

// this function wll select a room according to the number of players and the position of it on the list of rooms
var roomSelector = () => {
    let choosenRoomId = 0;
    if(rooms.length === 0) {
        choosenRoomId = Math.random();
        rooms.push(new Room(choosenRoomId));
    } else {
        let sortedRoom = rooms.sort(compare); // TODO test to see desending acending
        for(let i = sortedRoom.length - 1; i >= 0; i--) {
            let room = sortedRoom[i];
            if (room.onlinePlayers.length < maxPlayers) {
                choosenRoomId = room.id;
            }
        }
    }
    if(choosenRoomId === 0) {
        choosenRoomId = Math.random();
        rooms.push(new Room(choosenRoomId));
    }
    return choosenRoomId;
}
// this will add a player to the room that is selected
var addToJoinedRoom = (player) => {
    rooms.find(room => room.id === player.roomId).addToOnlinePlayers(player);
    player.joined = true;
}
// tjos will get initpack of all players and all room status in order to send to the player that is just joined
var getInitPack = (roomId) => {
    var pack = [];
    var pPack = [];
    var wPack = [];
    var room = rooms.find(x => x.id === roomId);
    for(let i = 0; i < room.onlinePlayers.length; i++) {
        pPack.push([room.onlinePlayers[i].name, room.onlinePlayers[i].tempScore, room.onlinePlayers[i].score, room.onlinePlayers[i].guessed, room.onlinePlayers[i].allowDraw, room.onlinePlayers[i].avatar]);
    }
    wPack.push(room.word.length);
    wPack.push(room.turnRunning);
    wPack.push(room.word.indexOf(' '));
    pack.push(pPack);
    pack.push(wPack);
    return pack;
}
// this will compare two room with each other see which one has less players
function compare(a, b) {
    let aa = a.onlinePlayers.length;
    let bb = b.onlinePlayers.length;

    let comparison = 0;
    if (aa > bb) {
      comparison = 1;
    } else if (bb > aa) {
      comparison = -1;
    }
    return comparison;
  }
// we export some of above functions/classes/variables in orter to be used in other pages
module.exports = {roomSelector, addToJoinedRoom, getInitPack};