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
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./user.js");
const cookieParser = require("cookie-parser");
const swaggerui = require("swagger-ui-express");
const swaggerjsdoc = require("swagger-jsdoc");
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');

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
app.use(cookieParser());
//req.cookie


const options = {

    definition: {
            openapi: "3.1.0",
            info: {
                title: "Weather Web Service",
                version: "1.0.0",
                description: 
                "Api documentation for the Weather Web Service",
                license: {
                    name: "License: MIT",
                    url: "https://spdx.org/licenses/MIT.html",
                        },
                    },
                    servers: [
                        {
                        url: "https://localhost:3000",
                        }
                  ]
            },
        apis: ["./*.js"]
    };
    
const specs = swaggerjsdoc(options);
    
app.use(
"/api/docs",
swaggerui.serve,
swaggerui.setup(specs, {explorer: true})
);
    

const apiLimiter = rateLimit({
    windowsMS: 1 * 60 * 1000, //15 Minutes
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
});
    

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


const secretKey = '__secreykey__';

function authenticateToken(req, res, next){

    const token = req.cookies.jwt;

    if(token) {
        jwt.verify(token, secretKey, (err, decoded) =>{
            if(err) {
                res.status(401).send('Invalid Token');
            }
          //req.userId = decoded;
        });
       next();
    } else {
    res.status(401).send('You are not authorized to access this page.');
    }
 }   



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

app.get("/register", (req, res) =>{
    res.render("register");
});

app.post("/register", async (req, res) => {

    const {email, password, confirmPassword} = req.body;   
    const user = await User.findOne({email});

   if(user){
       res.status(400).send('Username already exists.  Please try again.');
       return;
   }

   if(password != confirmPassword){
       res.status(400).send("Passwords do not match.");
       return;
   }

   bcrypt.hash(req.body.password, 10, (err, hashedPassword) =>{

   const user = new User({
       email: req.body.email,
       password: hashedPassword,
   });

   user.save();

   res.redirect("/");

   if(err){
       console.error("Error while hashing password:", finderr);
       res.status(500).send("Internal Server Error");
       return;
   }

   }); 
}); 



app.post("/login", async (req, res) =>{
    //shorthand 
    const {email, password} = req.body;
    
    //Find user in the database by email
    const user = await User.findOne({email});

    if(!user){
        //user is not found
    res.status(401).send('Invalid username or password.');
    return;
    }


    //Create a sign a JSON web token
    const unique = user._id.toString();

    const token = jwt.sign(unique, secretKey);

    //Set the token as a cookie
    res.cookie('jwt', token, {maxAge: 5 * 60 * 1000, httpOnly: true});



    bcrypt.compare(password, user.password, (err, result) =>{
        if(result){
            //Passwords do match & successful
            res.redirect("/tracker");
        } else if (!result){
            res.status(401).send('Invalid username or password.');
        } else {
            res.status(500).send('Internal Server Error:', err);
        }
    });
});




app.get("/tracker", authenticateToken, (req, res) =>{
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

app.get("/api/v1/videos", apiLimiter,  async (req, res) =>{
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

app.get("/api/v1/images", apiLimiter, async (req, res) =>{
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

app.get("/api/v1/weather", apiLimiter,  async (req, res) =>{
    try{
        const weatherData =  await Weather.find({});

        res.json(weatherData);

     }catch(error){
        res.status(500).send("Internal Server Error", error);
    }
});

//Create a websocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

//Define an event handler for new WebSocket connections
wss.on('connection', (ws) =>{
   console.log('Web Socket connection established');

    //Define an event handler for WebSocket messages
    ws.on('message', (message) =>{
        console.log(`Received message: ${message}`);
    });

    //Broadcast the message to all connected clients
    wss.clients.forEach((client) =>{
        if(client.readyState === WebSocket.Open){
            client.send(message);
        }
    });
});


app.listen(port, () =>{
    console.log(`Connected to ${port}`);
});

