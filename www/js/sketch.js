/*
  By: Cena Abachi
  gmail: devloger.io@gmail.com
  whatsapp: +98 9128573237
  last update: 5/11/2019
*/



// defining variable
var socket; // for holding socket

// everything about storing draw data
var points;
var paths;
var savedPaths;
var touched;

// for keeping html elements
var canvasDiv;
var canvasHolder;
var ctx;
var chooseWordDiv;
var word1Button;
var word2Button;
var word3Button;
var wordLabel;
var timerDiv;
var ladderDiv;
var guessDiv;
var typeButton;
var topThreeDiv;
var roundDiv;

// everything about game and players
var whosTurn;
var turnTime;
var turnRuning;
var wordLength;
var sortedPackByScore;
var player;

// everything about timing
var timeleft;
var maxTime;
var betweenTime;
var muteTimer;
var muteTime;
var showTopThreeTimer;
var showTopThreeTime;


// setup is a p5js function that happens before the draw function is executed on the begining, it basically happens before the game starts
function setup() {
  try {
    // by the following code we are adding the socket.io library to the html
    var socketIoLibraryHolder = document.getElementById('socketIoLibraryHolder');
    var socketIoLibraryScriptTag = document.createElement("socketIoLibraryScriptTag");
    socketIoLibraryHolder.appendChild(socketIoLibraryScriptTag); // adding it to the tag
    socket = io("http://localhost:2000", {'sync disconnect on unload': true}); // here we set the socket up by calling the io function which is necessary for seting the socket.io library up

    
    socket.on('connect', function() { // this is the default socket line that happens whenever socket succesfully connected to the server
      console.log('socket connected.'); // we say wer connected
      if(getParameterByName('guestIn') === 'true') { // we get the name parameter from the query string and check if wer signed as guest
        console.log('request to join as guest'); // we say so
        var username = getParameterByName('username'); // we also get the username parameter from the query string as well
        if(username !== '' && username.length <= 10 && username.length >= 1 && username.includes('>') === false && username.includes('<') === false && username.includes('/') === false && username.includes('\\') === false && username.includes('#') === false) { // this is the client side name validation that checks the length of name and unusual names
          socket.emit('join', {name: getParameterByName('username'), avatar: getParameterByName('avatar'), state: 'guest'});// if its ok, we send signin information to the server
        } else { // otherwise we do the disconnect action
          disconnectAction();
        }
      } else { // otherwise we do the disconnect action
        disconnectAction();
      }
    });

    // now we listen to different lines and we do a callback over them and we get the data recieved and store them as the input parameter, this is the standard way of socket.io library
    // Important note that for validating name, mute time and ... server also validate it, so even if the client know javascript and cheat, the server still keeps the player mute or wont let them to send bad data over the socket
    socket.on('init', function(data) { // this init line that we listen to is recievied at the moment player is connected, it will be only recieved once per connection, it basically gives the current information about the hole game until now
      console.log('init recieved'); // we sat so
      player.id = data.id; // we set the player id to the recieved id
      if(data.pack[1][1] === true) { // this will check if turn is running
        turnRuning = true; // we set the global variable to true
        player.allowGuess = true; // we allow the player to guess ////// TODO this can be go away, it might cause problems in feauture
        wordLength = data.pack[1][0]; // we set the length of the current word
        showEmptyLines(true, data.pack[1][2]); // we set the empty space if the word is two parted
      }

      updateLadder(data.pack[0]); // we update the ladder by the information of players
    });
    
    socket.on('mute', function() { // we listen to the mute line if server mute this player
      console.log('muted'); // we say so
      player.mute = true; // we set the global mute variable to true
      muteTimer = setTimeout(function() {// we start a timer that hast the exact same mute time as the server has TODO server can send the amount of time that the player is muted
        console.log('mute free'); // we say so
        player.mute = false; // we free the client
        clearTimeout(muteTimer); // we get rid of this timout
      }, muteTime); // assining the amount of time for this timer
    });

    socket.on('disconnect', function() { // this is also a default line of socket.io and it will be triggered whenever socket connection is lost
      console.log('disconnected'); // we say so
      disconnectAction(); // we do the disconnect action which is a function
    });

    socket.on('newPlayer', function(data) { // this will hapen whenever a new player is connected to the room
      console.log('a new player joined');
      if(player.turn === true && player.id !== whosTurn) {
        socket.emit('copyForNewPlayer', {id: data.id, pathsCopy: savedPaths, timeLeft: timeleft});
      }
    });

    socket.on('copyOfCurrentDraw', function(data) { // this will happen i order to receave the current draw data after joining the room
      console.log('copy of current draw recieved');
      if(player.turn === true)
        return;
      paths = data.pathsCopy;
      drawPaths();
      clockTimer(false, true, data.timeLeft);
    });
    
    socket.on('draw', function(data) { // this will happen whenever some one is drawing something
      points.push(data);
      drawPaths();
    });
    
    socket.on('newDraw', function() { // this will happen whenever the one whos drawing release the mouse and hold again
      points = [];
      paths.push(points);
      savedPaths.push(points);
    });
    
    socket.on('erase', function() { // this will happen if the one whos drawing use the erase tool
      console.log('erase')
      points = [];
      paths = [];
      savedPaths = [];
      drawPaths();
      clearCanvas();
    });
    
    socket.on('private', function(data) { // this will happen whenever server sends the secret word information to the client
      console.log('private message');
      if(data.state === "wordSuggestions") {
        showWordChoices(data.suggestions);
        player.turn = true;
      } else if(data.state === "allowDraw") {
        player.allowDraw = true;
        player.turn = true;
      } else if(data.state === "rightGuess") {
        console.log('GUESSED RIGHT');
        wordLabel.innerHTML = data.word;
      }
    });
    
    socket.on('roomBroadCastExc', function(data) { // this will happen whenever we have a room broadcast except the player who sends data
      console.log('broadcast except sender');
      if(data.state === "hint") { // this will happen if there is a character hint
        player.chars[data.index] = data.char;
        showEmptyLines(false, data.spaceIndex);
      }
    });
    
    socket.on('globalBroadCastExc', function(data) { // this will happen whenever we have a global broadcast except the player who sends data
      console.log('global broadcast except sender');
    });
    
    socket.on('roomBroadCast', function(data) { // this will be recieved by all players
      console.log('broadcast');
      if(data.state === "whosTurn") { // this will happen to say whos turn it is
        if(data.id === player.id) {
          player.turn = true;
        } else {
          whosTurn = data.id;
        }
      } else if(data.state === "roundStarted") { // this will happen if round is started
        if(player.turn === false) {
          wordLength = data.emptyLines;
          player.allowGuess = true;
          showEmptyLines(true, data.spaceIndex);
        } else {
          wordLabel.innerHTML = player.chosenWord;
        }
        turnRuning = true;
        points = [];
        paths = [];
        savedPaths = [];
        player.voteKick = false,
        clearCanvas();
        clockTimer(false, false, 0);
      } else if(data.state === "roundFinished") { // this will happen if round is finished
        console.log('roundFinished');
        clockTimer(true, false, 0);
        resetRound(data);
      } else if(data.state === "finalRoundFinished") { // this will happen if final round is finished
        console.log('finalRoundFinished');
        showTopThree();
        clockTimer(true, false, 0);
        resetRound(data);
      } else if(data.state === "updatePack") { // this will happen if we recieve update pack
        console.log('update pack recieved');
        updateLadder(data.pack);
        roundDiv.innerHTML = data.currentRound;
      } else if(data.state === "guess") { // this ill happen if some one guess something (almost any chat)
        if(data.guessed === false) {
          guessDiv.innerHTML += '<div class="guessDivInside" style="color:white;">' + data.name + ': ' + data.guess + '</div>';
        } else {
          guessDiv.innerHTML += '<div class="guessDivInside" style="color:#45ff70;">' + data.name + ': ' + data.guess + '</div>';
        }
        guessDiv.scrollTop = guessDiv.scrollHeight;// we scroll to the button right corner of guessDiv
        guessDiv.scrollLeft = guessDiv.scrollWidth;// we scroll to the button right corner of guessDiv
      }
    });
    
    socket.on('globalBroadCast', function(data) { // this will happen if server sends a message to all players online
      console.log('global broadcast');
    });


  } catch (exception) { // if we have error
    console.log(exception);
    disconnectAction(); // we handle the disconnection
  }

  setupVariables(); // by this function we set all the variables up
  setupCanvasAndGraphics(); // by this function we set the canvas and all about aspect ration up
}
 // setting all the global variables up
function setupVariables() {
  whosTurn = 0;
  turnTime = 0;
  turnRuning = false;
  wordLength = 0;
  sortedPackByScore = [];
  player = {
    id: 0,
    turn: false,
    allowDraw: false,
    guessed: false,
    allowGuess: false,
    currentScore: 0,
    chosenWord: "",
    chars: [],
    brushColor: '#000000',
    savedVrushColor: '#000000',
    brushSize: round(width*0.01),
    brushSizeName: 'small',
    voteKick: false,
    mute: false,
  };
  chooseWordDiv = document.getElementById('chooseWordDiv');
  word1Button = document.getElementById('word1Button');
  word2Button = document.getElementById('word2Button');
  word3Button = document.getElementById('word3Button');
  wordLabel = document.getElementById('wordLabel');
  timerDiv = document.getElementById('timerDiv');
  ladderDiv = document.getElementById('ladderDiv');
  guessDiv = document.getElementById('guessDiv');
  timerDiv = document.getElementById('timerDiv');
  canvasDiv = document.getElementById('canvasDiv');
  canvasHolder = document.getElementById('canvasHolder');
  typeButton = document.getElementById('typeButton');
  topThreeDiv = document.getElementById('topThreeDiv');
  roundDiv = document.getElementById('roundDiv');
  points = [];
  paths = [];
  savedPaths = [];
  timeleft = 1;
  maxTime = 80;
  betweenTime = 20;
  muteTimer = null;
  muteTime = 5000;
  showTopThreeTimer = null;
  showTopThreeTime = 5000;
  clearInterval(theTimer);
}
 // setting up everything about canvas and positioning it
function setupCanvasAndGraphics() {
  ctx = createCanvas(canvasHolder.offsetWidth, canvasHolder.offsetHeight);
  ctx.position(0,0);
  ctx.parent('canvasHolder');
  frameRate(25);
  clearCanvas();
}
// this will happen whenever the page is resized
function windowResized() {
  console.log('game resize');
  resizeCanvas(canvasHolder.offsetWidth, canvasHolder.offsetHeight);
  drawOldPaths();
}
// this is acually the p5js main loop but I have my own algorithm so the only use I have here is to check the mousepress (basically using it as the mousedown event)
function draw() {
  if(mouseIsPressed === true) {
    sendDrawData();
  }
}
// we handle the touch hold event as well
function touchStarted() {
  if(touched === true) {
    return;
  }
  touched = true;
  sendMousePressed();
}
// we handle the touch release event too
function touchEnded() {
  if(touched === true) {
    touched = false;
  }
}
// we draw the path of the line currently drawing
function drawPaths() {
  push();
  noFill();
  for(var i = 0; i < paths.length; i++) {
    beginShape();
    for(var j = 0; j < paths[i].length; j++) {
      var point = paths[i][j];
      stroke(point.color);
      if(point.size === 'small')
        strokeWeight(round(width*0.01)); 
      else if(point.size === 'medium')
        strokeWeight(round(width*0.03)); 
      else if(point.size === 'large')
        strokeWeight(round(width*0.05)); 
      else round(width*0.01);
      curveVertex(map(point.x, 0, 400, 0, width), map(point.y, 0, 400, 0, height));
    }
   endShape();
  }
  pop();
}
// we draw the old saved path for times that we loose canvas (drawing the saved path)
function drawOldPaths() {
  clearCanvas();
  paths = savedPaths;
  drawPaths();
}
// here we tell the server the mouse is pressed and we set the paths(current draw line) to empty array aswell
function sendMousePressed() {
  if(socket === null || player.allowDraw === false) {
    return;
  }
  paths = [];
  socket.emit('mousePressed');
}
//we send all the drawing data we need, the position of mouse, chosen color and chosen size but the most importantly HERE for x and y we map them between 0 and 400 so without caring about the resolution of the player device all the players will draw in the same aspect ratio
function sendDrawData() {
  if(socket === null || player.allowDraw === false) {
    return;
  } else {
    socket.emit('holdingDown', {x: round(map(mouseX, 0, width, 0, 400)), y: round(map(mouseY, 0, height, 0, 400)), color: player.brushColor, size:player.brushSizeName});
  }
}
// here we display the 3 words that server sends
function showWordChoices(words) {
  console.log('showWordChoices');
  chooseWordDiv.style.display = 'block';
  word1Button.innerHTML = words[0];
  word2Button.innerHTML = words[1];
  word3Button.innerHTML = words[2];
  word1Button.value = words[0];
  word2Button.value = words[1];
  word3Button.value = words[2];
}
//if word1 is choosed
function chooseWord1() {
  player.chosenWord = word1Button.value;
  sendChoosenWord();
}
//if word2 is choosed
function chooseWord2() {
  player.chosenWord = word2Button.value;
  sendChoosenWord();
}
//if word3 is choosed
function chooseWord3() {
  player.chosenWord = word3Button.value;
  sendChoosenWord();
}
//we send the word that is choosen to the server
function sendChoosenWord() {
  chooseWordDiv.style.display = 'none';
  socket.emit('chooseWord', {word:  player.chosenWord});
}
// this is no longer called, somehow wrong
function sendText() {
  if(player.mute === true) {
    guessDiv.innerHTML += '<div class="guessDivInside" style="color: white">' + '** MUTED **' + '</div>';
    chatInput.value = '';
    guessDiv.scrollTop = guessDiv.scrollHeight;
    return;
  }

  var word = chatInput.value;
  if(event.key === 'Enter') {
    if(word.trim() != '' && word.length <= 100 && word.includes('>') === false && word.includes('<') === false && word.includes('/') === false && word.includes('/') === false && word.includes('\\') === false && word.includes('#') === false) {
      socket.emit('guess', {guess:  chatInput.value});
    }
    chatInput.value = '';
  }
}

var theTimer;//  global variable timer
// this is the timer on the top left of the screen that shows the time remaining of each round, but if player join in the midle it should know about it, so it gets parameters
function clockTimer(roundFinished, isInMiddle, givenTimeLeft) {
  console.log('clockTimer');
  clearClockTimer();
  if(isInMiddle === true) {
    timeleft = givenTimeLeft;
  } else if(roundFinished === true) {
    maxTime = betweenTime;
  }
  timerDiv.innerHTML = maxTime;
  theTimer = setInterval(function(){
    timerDiv.innerHTML = maxTime - timeleft;
    timeleft += 1;
    if(timeleft >= maxTime){
      clearClockTimer();
    }
  }, 1000);
}
// this will get rid of the clock timer defined above
function clearClockTimer() {
    console.log('clearClockTimer');
    clearInterval(theTimer);
    timeleft = 1;
    maxTime = 80;
    betweenTime = 20;
}
// this will happen whenever someone vote to kick others
function voteKick() {
  if(player.voteKick === false) {
    player.voteKick = true;
    console.log('voteKick');
    socket.emit('voteKick');
  }
}
// this will make the cursure or the device to focus on the guess text input for chatting and stuff, usually used for the shortcut for bug phones
function typeFocus() {
  chatInput.focus();
}
// this will show empty lines above the screen so players can know how many characters the word has and also they will know if there be an empty space
function showEmptyLines(startRound, spaceIndex) {
  wordLabel.innerHTML = '';
  if(startRound === true) {
    for(var i = 0 ; i < wordLength ; i++) {
      if(i === spaceIndex) {
        player.chars.push('\u00A0\u00A0');
      } else {
        player.chars.push(' _ ');
      }
    }
  }
  for(var i = player.chars.length - 1 ; i >= 0 ; i--) {
    wordLabel.innerHTML += ' ' + player.chars[i] + ' ';
  }
}
// this will show the top three players after final round
function showTopThree() {
  topThreeDiv.style.display = 'block';
  topThreeDiv.innerHTML = '';
  var topThreeString = '';
  var topThreeCounter = 1;
  for(var i = sortedPackByScore.length - 1 ; i >= 0 ; i--) {
    if(topThreeCounter <= 3) {
      topThreeString += '<div class="topThreeDivInside"> <p class="topThreeP">';
      topThreeString += sortedPackByScore[i][0] + ' ---- ' + sortedPackByScore[i][2]; // + ' gained: ' + sortedPackByScore[i][1];
      topThreeString += '</p><div class="topThreeDivNumber">' + topThreeCounter + '</div>';
      topThreeString += '</div>';
      topThreeCounter++;
    }
  }
  topThreeDiv.innerHTML = topThreeString;

  showTopThreeTimer = setTimeout(function() {
    topThreeDiv.style.display = 'none';
    topThreeDiv.innerHTML = '';
    clearTimeout(showTopThreeTimer);
  }, showTopThreeTime);
}



// this is the disconnect action, it will somehow bring the player back to menu
function disconnectAction() {
  console.log('disconnectAction');
  window.location.href = 'index.html';
  chooseWordDiv.style.display = 'none';
  wordLabel.innerHTML = '';
  clearClockTimer();
}
// this will update the ladderDiv whenever necessary, it will infact sort the players out
function updateLadder(pack) {
  sortedPackByScore = pack.sort((a,b) => (a[2] > b[2]) ? 1 : ((b[2] > a[2]) ? -1 : 0)); 
  ladderDiv.innerHTML = '';
  var ladderString = ''
  for(var i = sortedPackByScore.length - 1 ; i >= 0 ; i--) {
    if(sortedPackByScore[i][3] === true) {
      console.log(sortedPackByScore[i][4]);
      ladderString += '<div class="ladderString1"><div class="ladderString2"><p class="ladderString3">' + sortedPackByScore[i][1] + '+</p></div><div><img src="./img/' + sortedPackByScore[i][5] + '.ico" alt="" class="ladderString4"></div><div><h4 class="ladderString5">';
      ladderString += sortedPackByScore[i][0] + '</h4><hr class="ladderString6"><h4 class="ladderString7">Score: ' + sortedPackByScore[i][2] + '</h4></div></div>';
    } else if(sortedPackByScore[i][3] !== true){
      console.log(sortedPackByScore[i][4]);
      if(sortedPackByScore[i][4] === false) {
        ladderString += '<div class="ladderString1"><div><img src="./img/' + sortedPackByScore[i][5] + '.ico" alt="" class="ladderString9"></div><div><h4 class="ladderString10">';
        ladderString += sortedPackByScore[i][0] + '</h4><hr class="ladderString11"><h4 class="ladderString12">Score: ' + sortedPackByScore[i][2] + '</h4></div></div>';
      }
      else if(sortedPackByScore[i][4] === true) {
        ladderString += '<div class="ladderString0"><div><img src="./img/' + sortedPackByScore[i][5] + '.ico" alt="" class="ladderString9"></div><div><h4 class="ladderString10">';
        ladderString += sortedPackByScore[i][0] + '</h4><hr class="ladderString11"><h4 class="ladderString12">Score: ' + sortedPackByScore[i][2] + '</h4></div></div>';
      }
    }
  }
  ladderDiv.innerHTML = ladderString;
}
// whenever round is reseted this will do the necessary stuff, somehow it resets everything back to normal
function resetRound(data) {
  console.log('resetRound');
  turnRuning = false;
  player.turn = false;
  player.allowDraw = false;
  chooseWordDiv.style.display = 'none';
  wordLabel.innerHTML = data.word;
  player.chars = [];
  if(data.state === 'roundFinished') {

  } else if (data.state === 'finalRoundFinished') {

  }
  //clearClockTimer();
}
// this will choose the tool player clicked on
function chooseTool(tool, value) {
  if(player.turn === false) {
    return;
  }
  if(tool === 'size') {
    if(value === 'small') {
      player.brushSize = round(width*0.01);
      player.brushSizeName = value;
    } else if(value === 'medium') {
      player.brushSize = round(width*0.03);
      player.brushSizeName = value;
    } else if(value === 'large') {
      player.brushSize = round(width*0.05);
      player.brushSizeName = value;
    }
  } else if(tool === 'delete') {
    socket.emit('delete');
  } else if(tool === 'color') {
    player.brushColor = value;
  } else if(tool === 'bucket') {
    console.log('bucket');
    // loadPixels();
    // floodFill(round(width/2), round(height/2), color(255, 0, 0), color(255, 255, 255));
    // updatePixels();
  } else if(tool === 'eraser') {
    console.log('erase');
    player.brushColor = '#f5f5f5';
  } else if(tool === 'brush') {
    player.brushColor = '#000000';
  }
}
// this is a function we never use because of performance problems, huge resolutions with low cpu will struggle doing it concider it happen simoltaniosly with the socket listenings!!!
function floodFill(x, y, fill_color, old_color) 
{
  if(x <= 0 || x >= width || y <= 0 || y >= height){
    return;
  }
  if(get(x, y)[0] == red(old_color) && get(x, y)[1] == green(old_color) && get(x, y)[2] == blue(old_color)) 
  {
    counter++;
      set(x, y, fill_color);
      floodFill(x + 1, y, fill_color, old_color);
      floodFill(x, y - 1, fill_color, old_color);
      floodFill(x - 1, y, fill_color, old_color);
      floodFill(x, y + 1, fill_color, old_color);
  }
} 
// this will simply clear the canvas, the canvas color is not white because of making a differance between white color and the eraser tool
function clearCanvas() {
  background(245);
}