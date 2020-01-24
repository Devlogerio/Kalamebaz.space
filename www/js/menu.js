/*
  By: Cena Abachi
  gmail: devloger.io@gmail.com
  whatsapp: +98 9128573237
  last update: 5/11/2019
*/

// var startGameSignIn = function () {
//     var userNameInput = document.getElementById('userNameInput');
//     var passwordInput = document.getElementById('passwordInput');
//     var signInButton = document.getElementById('signInButton');
//     var password = encode64(passwordInput.value);
//     window.location.href = 'game.html?signIn=' + signInButton.value + '&username=' + userNameInput.value + '&password=' + password;
//  }

// defining global variables
var characterIcons = [];
var avatars = [];
var choosenAvatar = '1';

// loading the character images
function loadCharacters() {
  for(var i = 1; i <= 119 ; i++) {
    characterIcons.push(i);
    document.getElementById('avatarSelectorInside').innerHTML += '<a class="imageFocuser" href="#"><img onclick="chooseAvatar(this.id)" id="' + i + '" src="./img/' + i + '.ico" alt="" class="avatar"></a>'
    avatars.push(document.getElementById(i));
  }
}
loadCharacters();

// if start button is pushed, this will happen, we redirect to game.html and we send entered and choosed information as query strings
var startGameGuestIn = function () {
   var userNameInput = document.getElementById('userNameInput');
   var guestInButton = document.getElementById('guestInButton');
   window.location.href = 'game.html?guestIn=' + guestInButton.value + '&username=' + userNameInput.value + '&avatar=' + choosenAvatar;
}

// if an avatar is choosed, this will happen
var chooseAvatar = function (avatarId) {
   for(var i in avatars) {
      avatars[i].style.backgroundColor = 'transparent';
      avatars[i].style.borderWidth = '0px';
      if(avatars[i].id === avatarId) {
         avatars[i].style.borderWidth = '5px';
         avatars[i].style.borderStyle = 'dashed';
         avatars[i].style.borderColor = '#1f003e';
      }
   }
   choosenAvatar = avatarId;
}