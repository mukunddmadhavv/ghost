const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const idlPath = path.join(__dirname, '../../../../anchor/target/idl/ghost_wallet.json');
    if (fs.existsSync(idlPath)) {
      const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
      res.json(idl);
    } else {
      res.status(404).json({ error: 'IDL not found. Please run anchor build.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
