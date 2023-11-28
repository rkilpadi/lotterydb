const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/user');
const Lottery = require('./models/lottery');
const LotteryEntry = require('./models/lotteryEntry');

const app = express();
app.use(cors());

mongoose.connect(process.env.CONNECTION_STRING)
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.on('open', () => console.log('Connected to MongoDB'));

app.use(express.json());

// Returns all lotteries
app.get('/lotteries', async (req, res) => {
    try {
        const lotteries = await Lottery.find().limit(100);
        res.json(lotteries);
    } catch (error) {
        console.log(error);
    }
});

// Returns all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find().limit(100);
        res.json(users);
    } catch (error) {
        console.log(error);
    }
});

// Returns all users registered for a lottery
// If a lottery has winners, returns the winners instead
app.get('/users/lottery/:lotteryId', async (req, res) => {
    try {
        const lotteryId = req.params.lotteryId;
        const lotteryEntries = await LotteryEntry.find({ lotteryId: lotteryId }).limit(100);
        const userIds = [...new Set(lotteryEntries.map(entry => entry.userId))];
        const users = await User.find({ userId: { $in: userIds } }).limit(100);
        res.json(users);
    } catch (error) {
        console.log(error);
    }
});

// Returns a list of lotteries a user is registered for
app.get('/lotteries/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const lotteryEntries = await LotteryEntry.find({ userId: userId }).limit(100);
        const lotteryIds = [...new Set(lotteryEntries.map(entry => entry.lotteryId))];
        const lotteries = await Lottery.find({ lotteryId: { $in: lotteryIds } }).limit(100);
        res.json(lotteries);
    } catch (error) {
        console.log(error);
    }
})

// Returns whether or not a user is registered for a lottery
app.get('/lotteryentries/:userId/:lotteryId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const lotteryId = req.params.lotteryId;
        const lottery = await Lottery.findOne({ lotteryId: lotteryId });
        if (lottery && lottery.drawn) {
            res.json({ drawn: true, registered: false });
            return;
        }

        const entry = await LotteryEntry.findOne(
            { userId: userId, lotteryId: lotteryId }
        );
        res.json({ drawn: false, registered: entry !== null });
    } catch (error) {
        console.log(error);
    }
});

// Adds user to lottery pool if lottery has not been drawn
app.post('/lotteryentries/:userId/:lotteryId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const lotteryId = req.params.lotteryId;
        const lottery = await Lottery.findOne({ lotteryId: lotteryId });
        if (lottery.drawn) {
            res.json({ success: false });
            return;
        }

        const entry = new LotteryEntry({ userId: userId, lotteryId: lotteryId });
        await entry.save();
        res.json({ success: true });
    } catch (error) {
        console.log(error);
    }
});

// Removes user from lottery pool if lottery has not been drawn
app.delete('/lotteryentries/:userId/:lotteryId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const lotteryId = req.params.lotteryId;
        const lottery = await Lottery.findOne({ lotteryId: lotteryId });
        if (lottery.drawn) {
            res.json({ success: false });
            return;
        }

        const entry = await LotteryEntry.deleteOne(
            { userId: userId, lotteryId: lotteryId }
        );
        res.json({ success: entry !== null })
    } catch (error) {
        console.log(error);
    }
});

// Draws the winners for a specific lottery
app.post('/lotteries/draw/:lotteryId', async (req, res) => {
    try {
        const lotteryId = req.params.lotteryId;
        const lottery = await Lottery.findOne({ lotteryId: lotteryId });

        let winningEntries;
        let winningIds;
        if (lottery.drawn) {
            winningEntries = await LotteryEntry.find({ lotteryId: lotteryId });
            winningIds = winningEntries.map(entry => entry.userId);
        } else {
            lottery.set({ drawn: true });
            await lottery.save();
            winningEntries = await LotteryEntry.aggregate([
                { $match: { lotteryId: lotteryId } },
                { $sample: { size: lottery.ticketsAvailable } },
            ]);
            winningIds = winningEntries.map(entry => entry.userId);
            await LotteryEntry.deleteMany({
                lotteryId,
                userId: { $nin: winningIds }
            });
        }

        const winners = await User.find({
            userId: { $in: winningIds }
        });
        res.json(winners);
    } catch (error) {
        console.log(error);
    }
});

// Resets the database to its initial state
app.post('/reset', async (req, res) => {
    try {
        await Lottery.deleteMany({});
        await User.deleteMany({});
        await LotteryEntry.deleteMany({});
        await Lottery.create([
            { lotteryId: '1', lotteryName: 'Event 1', ticketsAvailable: 1 },
            { lotteryId: '2', lotteryName: 'Event 2', ticketsAvailable: 2 },
            { lotteryId: '3', lotteryName: 'Event 3', ticketsAvailable: 3 },
        ]);
        await User.create([
            { userId: '1', name: 'User 1' },
            { userId: '2', name: 'User 2' },
            { userId: '3', name: 'User 3' }
        ]);
        await LotteryEntry.create([
            { lotteryId: '1', userId: '1' },
            { lotteryId: '1', userId: '2' },
            { lotteryId: '2', userId: '2' },
            { lotteryId: '2', userId: '3' },
            { lotteryId: '3', userId: '1' },
            { lotteryId: '3', userId: '3' }
        ]);
        res.json({ success: true });
    } catch (error) {
        console.log(error);
    }
});

app.listen(3001);
