const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Weather = require("./weather.js");
const axios = require("axios");
const multer = require("multer");

const app = express();
const port = 3000;

const url = `mongodb+srv://ToddN:Password123@cluster0.5x5qoad.mongodb.net/`;

mongoose.connect(url)
.then(()=> {
    console.log("Connected to NoSQL Database (MongoDB)");
})
.catch((err) => {
    console.error(`Error connecting to the database: ${err}`);
});

app.set("views", "./views");
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.static("public/images"));
app.use(express.static("public/css"));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', async (req, res) =>{
    
    let messageType;
    let headline;
    let sender;

    try{

        const response = await axios.get('https://api.weather.gov/alerts/active?');

        const alertData = response.data.features[0].properties;
        messageType = alertData.messageType;
        headline = alertData.headline;
        sender = alertData.senderName;

        const weatherData = await Weather.find({});
        res.render('home', {weatherData, messageType, headline, sender});

    }catch(error){
      res.status(500).send("Internal Server Error", error);
    }
});


app.get("/tracker", (req, res) =>{
    res.render("tracker");
});

app.post("/weather", async (req, res) => {
    try{
        const {city, temperature, humidity} = req.body;

        const weatherData = new Weather({
            city: city,
            temperature: temperature,
            humidity: humidity,
        });

        await weatherData.save();

      res.redirect("/tracker");

    }catch(err){
        res.status(500).send("Internal Server Error", err)
}

});


//set storage for the image
var storage = multer.diskStorage({
    destination: function(req, file, cb){
      cb(null, 'uploads');
    },
    filename: function(req, file, cb){

        console.log(file)
        cb(null, file. originalname + '-' + Date.now());
      },
});

var upload = multer({storage: storage});


app.post("/uploadphoto", upload.single('myImage'), (req, res) => {

});




app.listen(port, () =>{
    console.log(`Connected to ${port}`);
});

