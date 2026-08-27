const express = require('express');
const router = express.Router();

const statsController = require('../controllers/statsController');
const entityController = require('../controllers/entityController');
const relationshipController = require('../controllers/relationshipController');
const riskController = require('../controllers/riskController');

// Health & Stats
router.get('/health', statsController.getHealth);
router.get('/stats', statsController.getStats);

// Entity search & detail
router.get('/entities', entityController.getEntities);
router.get('/entities/:id', entityController.getEntityById);

// Graph relationships & multi-hop traversal
router.get('/entities/:id/network', relationshipController.getEntityNetwork);
router.get('/ownership/path', relationshipController.getOwnershipPath);

// Graph risk analysis
router.get('/risk-analysis', riskController.getRiskAnalysis);

module.exports = router;
