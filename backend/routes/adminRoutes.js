const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getUsers,
  updateUserRole,
  deleteUser,
  createStock,
  deleteStock,
  getAllTrades
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Apply protection and admin access to all routes
router.use(protect);
router.use(adminOnly);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.post('/stocks', createStock);
router.delete('/stocks/:symbol', deleteStock);
router.get('/trades', getAllTrades);

module.exports = router;
