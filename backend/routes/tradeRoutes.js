const express = require('express');
const router = express.Router();
const { buyStock, sellStock, getPortfolio, getTransactionHistory } = require('../controllers/tradeController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/portfolio', getPortfolio);
router.get('/history', getTransactionHistory);

module.exports = router;
