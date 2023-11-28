const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LotteryEntry = new Schema({
    lotteryId: String,
    userId: String,
});

LotteryEntry.index({ userId: 1, lotteryId: 1 }, { unique: true });

module.exports = mongoose.model('LotteryEntry', LotteryEntry);
