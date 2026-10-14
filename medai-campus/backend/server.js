require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initSchema } = require('./db');
const professorsRouter = require('./routes/professors');
const adminRouter = require('./routes/admin');
const aiRouter = require('./routes/ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/professors', professorsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;

initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`VeloraMED backend listening on ${PORT}`));
  })
  .catch((err) => {
    console.error('Échec initialisation base de données', err);
    process.exit(1);
  });
