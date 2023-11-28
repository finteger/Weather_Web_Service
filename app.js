const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Weather = require("./weather.js");

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
    try{
        const weatherData = await Weather.find({});
        res.render('home', {weatherData});
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


app.listen(port, () =>{
    console.log(`Connected to ${port}`);
});

