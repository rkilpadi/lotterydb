const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Lottery = new Schema({
    lotteryId: { type: String, index: true },
    lotteryName: String,
    ticketsAvailable: Number,
    drawn: { type: Boolean, default: false },
});

module.exports = mongoose.model('Lottery', Lottery);
