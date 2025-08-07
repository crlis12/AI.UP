const express = require('express');
const cors = require('cors');
const app = express();
const authRouter = require('./routes/auth');


app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/auth', authRouter);

app.listen(3000, () => {
  console.log('Server is running on port 3001');
});

