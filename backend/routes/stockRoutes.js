const express = require('express');
const router = express.Router();
const { getStocks, getStockBySymbol, searchStocks } = require('../controllers/stockController');

router.get('/', getStocks);
router.get('/search', searchStocks);
router.get('/:symbol', getStockBySymbol);

module.exports = router;
