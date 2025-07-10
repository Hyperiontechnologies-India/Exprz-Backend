const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/cod', orderController.createCODOrder);
router.get('/:orderId', orderController.getOrder);

module.exports = router;