const mongoose = require("mongoose");

//Define the schema for the weather data
const weatherSchema = new mongoose.Schema({
    city: {type: String, required: true},
    temperature: {type: Number, required: true},
    humidity: {type: Number, required: true}
});

module.exports = mongoose.model('Weather', weatherSchema)