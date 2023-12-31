const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    userId: {type: String, index: true},
    name: String,
});

module.exports = mongoose.model('User', User);
