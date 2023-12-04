const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Weather = require("./weather.js");
const Image = require("./image.js");
const Video = require("./video.js");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const mcache = require("memory-cache");

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

//High-level middleware to cache pages in  memory
var cache = (duration) =>{
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url;
        let cacheBody = mcache.get(key);
        if(cacheBody){
            res.send(cacheBody);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) =>{

            mcache.put(key, body, duration * 1000);
            res.sendResponse(body);
            }
   
        }
        next();
    }
}


//cache(100), 

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
       
        const imager = await Image.find({});
        const images = imager.map(image => {
        return{
            name: image.name,
            desc: image.desc,
            data: image.img.data.toString('base64'),
        }
        });

        const videor = await Video.find({});
        const videos = videor.map(video => {
        return{
            name: video.name,
            desc: video.desc,
            contentType: video.vid.contentType,
            data: video.vid.data.toString('base64'),
        }
        });

     
    let fetchedData;

    axios.get('https://api.openweathermap.org/data/2.5/weather?lat=52.2668&lon=-113.802&appid=ce8eb3004b0dcfd8664bd52d8f1eae78')
    .then(response => {

    fetchedData = response.data;

    res.render('home', 
    { weatherData,
      messageType,
      headline,
      sender,
      videos,
      images,
      fetchedData
      });
    });

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
        cb(null, file.originalname + '-' + Date.now());
      },
});

var upload = multer({storage: storage});


app.post("/uploadphoto", upload.single('myImage'), (req, res) => {
// req.file

    var img = fs.readFileSync(req.file.path);
    var encode_img = img.toString('base64');
    var final_img = {
        contentType: req.file.mimetype,
        data: new Buffer.from(encode_img, 'base64'),
    }

    const image = new Image({
        name: req.body.name,
        desc: req.body.desc,
        img: final_img,
    });

    image.save();

});


app.post("/uploadvideo", upload.single('myVideo'), (req, res) => {
    // req.file
    
        var vid = fs.readFileSync(req.file.path);
        var encode_vid = vid.toString('base64');
        var final_vid = {
            contentType: req.file.mimetype,
            data: new Buffer.from(encode_vid, 'base64'),
        }
    
        const video = new Video({
            name: req.body.name,
            desc: req.body.desc,
            vid: final_vid,
        });
        video.save();  
});

app.post("/uploadphoto", upload.single('myImage'), (req, res) => {
    // req.file
    
        var img = fs.readFileSync(req.file.path);
        var encode_img = img.toString('base64');
        var final_img = {
            contentType: req.file.mimetype,
            data: new Buffer.from(encode_img, 'base64'),
        }
    
        const image = new Image({
            name: req.body.name,
            desc: req.body.desc,
            img: final_img,
        });
        image.save();  
});

app.get("/api/v1/videos", async (req, res) =>{
    try {
        const videos = await Video.find({});
        const individualVideo = videos.map((video) =>{

            const videoData = video.vid.data.toString('base64');

            return {
                contentType: video.vid.contentType,
                data: videoData,
            };
        });
        res.json(individualVideo);
    }catch(error){
        res.status(500).send("Internal Server Error", error);
    }
});

app.get("/api/v1/images", async (req, res) =>{
    try {
        const images = await Image.find({});
        const individualImage = images.map((image) =>{

            const imageData = image.img.data.toString('base64');

            return {
                contentType: image.img.contentType,
                data: imageData,
            };
        });
        res.json(individualImage);
    }catch(error){
        res.status(500).send("Internal Server Error", error);
    }
});

app.get("/api/v1/weather", async (req, res) =>{
    try{
        const weatherData =  await Weather.find({});

        res.json(weatherData);

     }catch(error){
        res.status(500).send("Internal Server Error", error);
    }
});



app.listen(port, () =>{
    console.log(`Connected to ${port}`);
});

