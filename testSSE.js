import express from "express";
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express();
const port = 3000;

const cacheClient = {}

app.use(cors())
app.use(bodyParser.json())

app.get('/api/sse', (req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    cacheClient['test'] = res
    // setTimeout(() => {
    //   res.write("data: " + 'opened' + '\n\n');
    // }, 5000)

    // res.send('okokoko')


  } catch (error) {
    console.log("🩲 🩲 => app.get => error:", error)

  }
});

app.post('/api/sse/send', async (req, res) => {
  try {
    await cacheClient['test'].write("data: " + req.body.mnemonic + '\n\n')

    res.send('ok')

  } catch (error) {
    console.log("🩲 🩲 => app.post => error:", error)

  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});