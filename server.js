const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock Database Memory (Real project mein yeh MySQL ya MongoDB database se connect hota hai)
let userDatabase = {
    "923001234567": { name: "Zain Ali", balance: 5000, activeWallet: "Easypaisa" }
};

// Global Game State Tracker
let currentRound = 101;
let timeLeft = 30; // 30 seconds round timer
let historicalResults = ['Red', 'Green', 'Red', 'Violet', 'Green'];
let activeBets = []; // Is round ke saare bets yahan collect hotay hain

// Infinite Server Loop for Game Rounds
setInterval(() => {
    if (timeLeft > 0) {
        timeLeft--;
    } else {
        // Timer 0 ho gaya -> Result generate karo aur winners ko pay karo
        executeRoundSettlement();
        timeLeft = 30; // Timer reset
        currentRound++;
    }
}, 1000);

// Core RNG Selection Logic
function executeRoundSettlement() {
    const pool = ['Red', 'Green', 'Red', 'Green', 'Violet'];
    const winningColor = pool[Math.floor(Math.random() * pool.length)];
    historicalResults.unshift(winningColor); // History mein add karo
    if (historicalResults.length > 10) historicalResults.pop();

    // Bets calculate karo
    activeBets.forEach(bet => {
        let user = userDatabase[bet.phone];
        if (user) {
            if (bet.predictedColor === winningColor) {
                // User Jeet Gaya (Double Payout)
                let prize = bet.stakeAmount * 2;
                user.balance += prize;
            }
        }
    });

    // Aglay round ke liye logs clear karo
    activeBets = [];
}

// REST API Endpoints Front-End ke liye
app.get('/api/game-state', (req, res) => {
    res.json({
        round: currentRound,
        timer: timeLeft,
        history: historicalResults
    });
});

app.post('/api/get-profile', (req, res) => {
    const { phone } = req.body;
    if (userDatabase[phone]) {
        res.json({ success: true, profile: userDatabase[phone] });
    } else {
        res.json({ success: false, message: "User not verified via KYC." });
    }
});

app.post('/api/place-bet', (req, res) => {
    const { phone, color, amount } = req.body;
    let user = userDatabase[phone];

    if (!user) return res.status(400).json({ success: false, message: "User session expired." });
    if (user.balance < amount) return res.status(400).json({ success: false, message: "Insufficient Balance in Easypaisa node." });
    if (timeLeft <= 5) return res.status(400).json({ success: false, message: "Betting locked for this round!" });

    // Deduct capital stake
    user.balance -= amount;
    activeBets.push({ phone, predictedColor: color, stakeAmount: amount });

    res.json({ success: true, newBalance: user.balance, message: "Bet secured successfully." });
});

app.listen(PORT, () => console.log(`92 Jeeto Core Server running on port ${PORT}`));
