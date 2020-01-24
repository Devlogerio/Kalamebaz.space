/*
  By: Cena Abachi
  gmail: devloger.io@gmail.com
  whatsapp: +98 9128573237
  last update: 5/11/2019
*/

// here we add the code needed for this page
const {roomSelector, addToJoinedRoom, getInitPack} = require('./utils/functions');
const {Player} = require('./utils/player');
const {rooms} = require('./utils/room');

// here be add the libraries needed
const http = require('http');
const socketIO = require('socket.io'); // for socket.io we need to do an npm install socket.io on the therminal as well

const port = process.env.PORT || 2000; // here we assign the environment default port and the debug 2000 port
var server = http.createServer(); // here we set the server up
io = socketIO(server); // here we set the socket.io up over the http server

// defining global variables
SOCKET_LIST = [];
var lastChatNames = [];

server.listen(port, () => { // here we listen if the server staerted so we log it
    console.log(`Server is up on port ${port}`);
})

// socket.io default and main socket listening (connection) witch should be there in orther to make the socket connection work
io.on('connection', (socket) => {
    console.log('someone connected.');
    SOCKET_LIST[socket.id] = socket;
    let player;
    socket.on('join', (data) => { // we listen to the join line and we do some call back with its data
        var letters = /^[A-Za-z]+$/; // these are for validationg
        if(data.state === 'guest') { // if joining as guest (we only accept guests now)
            if(data.name.match(letters) && data.name != '' && data.name.length <= 10 && data.name.length >= 1 && data.name.includes('>') === false && data.name.includes('<') === false && data.name.includes('/') === false && data.name.includes('/') === false && data.name.includes('\\') === false && data.name.includes('#') === false && !/\s/.test(data.name)) {
                player = new Player(socket.id, data.name, data.avatar, roomSelector());
                addToJoinedRoom(player);
                socket.join(player.roomId);
                socket.emit('init', {id: socket.id, pack: getInitPack(player.roomId)});
                socket.broadcast.to(player.roomId).emit('newPlayer', {id: player.id});
            } else {
                socket.disconnect();
                return;
            }
        }
        else if(data.state === 'player') { // if state is signed in player
            socket.disconnect();
            return;
        } else { // if join data is not valid or handled
            socket.disconnect();
            return;
        }
    });
    // this will listen to the copy of the current drawing sent by the drawer
    socket.on('copyForNewPlayer', (data) => {
        if(rooms.find(x => x.id === player.roomId).whosTurn === player.id) {
            if(SOCKET_LIST[data.id])
                SOCKET_LIST[data.id].emit('copyOfCurrentDraw', {pathsCopy: data.pathsCopy, timeLeft: data.timeLeft});
        }
    });
    // listen whenever mouse is pressed
    socket.on('mousePressed', () => {
        if(player.allowDraw === true)
            io.to(player.roomId).emit('newDraw');
    });
    // listen whenever mouse is hold
    socket.on('holdingDown', (data) => {
        if(player.allowDraw === true)
            io.to(player.roomId).emit('draw', data);
    });
    // listen whenever player uses erase tool
    socket.on('delete', () => {
        if(player.allowDraw === true)
            io.to(player.roomId).emit('erase');
    });
    // listens to the player word choice and set it
    socket.on('chooseWord', (data) => {
        console.log('chooseWord');
        var room = rooms.find(x => x.id === player.roomId);
        if(room.whosTurn === player.id) {
            room.wordChosen(player.id, data.word);
        }
    });
    // listens whenever someone chat or guess
    socket.on('guess', (data) => {
        if(player.spammer === true) {
            console.log('SPAMMMERR');
            socket.emit('mute');
            return;
        } else if(data.guess.trim() != '' && data.guess.length <= 100 && data.guess.includes('>') === false && data.guess.includes('<') === false && data.guess.includes('/') === false && data.guess.includes('/') === false && data.guess.includes('\\') === false && data.guess.includes('#') === false) {
            rooms.find(x => x.id === player.roomId).guessed(player, data.guess.toLowerCase());
        }

        lastChatNames.push(player.id);
        if(lastChatNames.length >= 5) {
            if(lastChatNames.every( ch => ch === lastChatNames[0] )) {
                player.spammed();
                lastChatNames = [];
            } else {
                lastChatNames = [];
            }
        }
    });
    // listens to the vote kick from the client
    socket.on('voteKick', () => {
         rooms.find(x => x.id === player.roomId).votedForKick(player);
    });
    // happens whenever client tries to know the length of the players on the server not the players on the room (this is for debugging for the developer)
    socket.on('needLog', (data) => {
        socket.emit('logResault', {players: players.length});
    });
    // this will happen whenever someone disconnects under any sircumstances, this is a default socket.io line
    socket.on('disconnect', () => {
        console.log('someone disconnected.');
        if(!player) {
            delete SOCKET_LIST[socket.id];
            return;
        }
        // save the id before deleting
        var leaverId = player.id;

        // delete socket from socketlist
        delete SOCKET_LIST[socket.id];

        // delete player from room
        var theRoom = rooms.find(x => x.id === player.roomId);
        theRoom.onlinePlayers.splice(theRoom.onlinePlayers.findIndex(x => x.id === leaverId), 1);

        // find the empty room and delete it
        var emptyRoomIndex = rooms.findIndex(x => x.onlinePlayers.length < 1);
        // delete rooms[theRoom.id];
        
        theRoom.someoneLeaved(leaverId);

        if(emptyRoomIndex !== -1) {
            theRoom.clearAllTimouts(); // we clear All imeouts first
            rooms.splice(emptyRoomIndex, 1);
            console.log('empty room deleted');
        }

        theRoom = {}; // avoid timout duplicates to stay on, we clear the refrence
    });
});


// we delete the room by force from the sever, cause deleting the room is a bit tricky when we have alot of instances of it hanging around
forceDeleteRoom = () => {
    console.log('chooseWhosTurn');
    for(var i in rooms) {
        if(rooms[i].onlinePlayers.length <= 0) {
            try{
                rooms.splice(i, 1);
            } catch (exception) {
                console.log('could not force players to disconnect');
            }
        }
    }
}
