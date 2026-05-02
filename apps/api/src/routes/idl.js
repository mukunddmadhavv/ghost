const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    // Check for local copy first (committed to git for Render)
    let idlPath = path.join(__dirname, '../idl/ghost_wallet.json');
    
    // Fallback to local anchor target (for local development)
    if (!fs.existsSync(idlPath)) {
      idlPath = path.join(__dirname, '../../../../anchor/target/idl/ghost_wallet.json');
    }

    if (fs.existsSync(idlPath)) {
      const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
      res.json(idl);
    } else {
      res.status(404).json({ 
        error: 'IDL not found.',
        message: 'Please copy anchor/target/idl/ghost_wallet.json to apps/api/src/idl/ and commit it.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
