/*
  By: Cena Abachi
  gmail: devloger.io@gmail.com
  whatsapp: +98 9128573237
  last update: 5/11/2019
*/


const mongoose = require("mongoose"); // adding the mongoose library, npm install is necesarry
mongoose.Promise = global.Promise; // in orther to use the promises for handling database
mongoose.connect("mongodb://localhost:27017/words", {useNewUrlParser: true}); // trying to connect to the mongodb, connection string should be right, otherwise game will not work currectly


// this is for creating a cheme with the mongodb format
var wordSchema = new mongoose.Schema({
    word: {
        type: String,
        required: true
    }
});
// this is inserting a new collection with the desired name to the mongodb
var Words = mongoose.model("words", wordSchema);

// var words = ['apple', 'car', 'helicopter', 'labtop', 'pc', 'phone', 'human', 'monkey', 'cat', 'world', 'grass', 'champion', 'dog', 'carpet', 'worm', 'movie', 'war', 'son', 'sister', 'cousin', 'leg', 'zombie', 'ant', 'superman', 'dead', 'home', 'travel', 'dog', 'enemy', 'game', 'doughter', 'banana', 'motorcycle', 'tank', 'marry', 'microphone', 'dress', 'tail', 'table', 'television', 'shop', 'ring', 'ocean', 'deep', 'bird', 'cocroach', 'race', 'naked'];
var words = ['ماشین', 'خانه', 'زمین', 'میز', 'در', 'صندلی', 'بد', 'مادر', 'پدر', 'عمو', 'پسرخاله', 'خورشید', 'کتاب', 'کشور', 'روح', 'لپتاپ', 'کیبورد', 'موبایل', 'نقاشی', 'اتشنشان', 'قهوه', 'هدفون', 'لیوان چای', 'کت شلوار', 'ترس', 'دروغگو', 'پولدار', 'جادوگر', 'مهندس', 'دانشگاه', 'مدرسه', 'پروانه', 'اخوندک', 'سوسک', 'مورچه', 'فیل', 'شتر', 'پلنگ', 'صحرا', 'دریا', 'رودخانه', 'چاقو', 'جنگ', 'تانک', 'شهر', 'تهران', 'اصفحان', 'امریکا', 'سامسونگ', 'اژدها', 'چین', 'قاتل', 'مامور', 'ماشین پلیس', 'همسایه', 'پسر', 'دختر', 'بچه', 'نگرانی', 'ساعت', 'مرز', 'برج', 'مثلث', 'کامپیوتر', 'دفتر خاطرات', 'سوپرمن', 'مرد عنکبوتی', 'برق', 'بتمن', 'سیب'];

// this will populate the collection in mongo db with the data we want
async function startSeed() {
    for (var i = 0; i < words.length; i++) {
        var doc = await Words({word: words[i]}).save();
        console.log(doc);
    }
    console.log("succesfull write");
}

startSeed();