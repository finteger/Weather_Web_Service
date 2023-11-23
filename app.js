const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");

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


app.listen(port, () =>{
    console.log(`Connected to ${port}`);
});

