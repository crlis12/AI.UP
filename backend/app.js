const express = require('express');
const cors = require('cors');
const app = express();
const authRouter = require('./routes/auth');
const childrenRouter = require('./routes/children');
const diariesRouter = require('./routes/diaries');
const summarizeRouter = require('./routes/summarize');
const agentRouter = require('./routes/agent');


app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/children', childrenRouter);
app.use('/diaries', diariesRouter);
app.use('/summarize', summarizeRouter);
app.use('/agent', agentRouter);

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

