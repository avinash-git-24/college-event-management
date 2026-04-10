const express = require('express');
const router = express.Router();

const { test } = require('../controllers/testController');

// GET /api/test
router.get('/', test);

module.exports = router;
