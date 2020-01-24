const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/words", {useNewUrlParser: true, useUnifiedTopology: true});

var wordSchema = new mongoose.Schema({
    word: {
        type: String,
        required: true
    }
});

var randomNumber = (min, max) => { // even negative numbers are supported
    return Math.floor(Math.random() * (max - min) + min);
}

var Words = mongoose.model("words", wordSchema);
var localWords = [];
// var isLocalWordsLoaded = false;
function getWordsFromDb() {
    return new Promise((resolve, reject) => {
        Words.find({}).then((docs) => {
            docs.forEach((item) => {
                localWords.push(item.word);
            })
            resolve(localWords);
        }).catch((err) => {
            reject(err);
        })
    })

}

function getWords() {
    var threeWords = [];
    return new Promise((resolve, reject) => {
        getWordsFromDb().then((words) => {
            for (var i = 0; i < 3; i++) {
                var chosenIndex = randomNumber(0, words.length);
                threeWords.push(words[chosenIndex]);
                words.splice(chosenIndex, 1);
            }
            resolve(threeWords);
        }).catch((err) => {
            reject(err);
        })
    })
}


module.exports = {getWords}


