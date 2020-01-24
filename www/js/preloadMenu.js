/*
  By: Cena Abachi
  gmail: devloger.io@gmail.com
  whatsapp: +98 9128573237
  last update: 5/11/2019
*/

// this will happen before the page load completely, so this to avoid starting the game with uncompleted avatar images, it will download and store every avatar icon then game will start
var characterIcons = [];

function preload() {
  for(var i = 0; i < 119 ; i++) {
    characterIcons.push(loadImage('./img/' + i + '.ico'));
  }
}