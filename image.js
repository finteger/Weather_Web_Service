const mongoose = require('mongoose');



//Define new schema for the image data
const imageSchema = new mongoose.Schema({
    name: String,
    desc: String,
    img: {
        data: Buffer,
        contentType: String,
    }

});

module.exports = mongoose.model('Image', imageSchema);