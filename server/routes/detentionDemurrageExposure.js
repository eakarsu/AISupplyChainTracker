const express = require('express');

const router = express.Router();

let exposures = [
  { id: 1, shipment: 'SHP-10482', terminal: 'Pier 400', freeTimeHours: 18, projectedDwellHours: 31, exposureUsd: 780, owner: 'Ocean ops', status: 'escalate' },
  { id: 2, shipment: 'SHP-10491', terminal: 'NS Savannah', freeTimeHours: 24, projectedDwellHours: 20, exposureUsd: 0, owner: 'Brokerage', status: 'clear' },
  { id: 3, shipment: 'SHP-10502', terminal: 'BNSF Logistics Park', freeTimeHours: 12, projectedDwellHours: 19, exposureUsd: 410, owner: 'Dray desk', status: 'watch' }
];

router.get('/', (req, res) => {
  const summary = exposures.reduce((acc, row) => {
    acc.total += 1;
    acc.exposureUsd += Number(row.exposureUsd || 0);
    acc.escalate += row.status === 'escalate' ? 1 : 0;
    return acc;
  }, { total: 0, exposureUsd: 0, escalate: 0 });
  res.json({ exposures, summary });
});

router.post('/', (req, res) => {
  const item = {
    id: Date.now(),
    shipment: req.body.shipment || 'SHP-pending',
    terminal: req.body.terminal || 'Terminal TBD',
    freeTimeHours: Number(req.body.freeTimeHours || 0),
    projectedDwellHours: Number(req.body.projectedDwellHours || 0),
    exposureUsd: Number(req.body.exposureUsd || 0),
    owner: req.body.owner || 'Ops owner',
    status: req.body.status || 'watch'
  };
  exposures = [item, ...exposures];
  res.status(201).json(item);
});

module.exports = router;
