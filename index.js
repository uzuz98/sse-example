import express from "express";
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express();
const port = 3001;

app.use(cors())
app.use(bodyParser.json())

const cacheClient = {}
const cacheIntegrationClient = {}
const cacheEventIntegrationClient = {}

const handleCacheIntegration = () => {
  so
}

const getUniqKey = (partner, id) => {
  return `${partner}-${id}`
}

const startSSE = (res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
}

app.get('/api/sse', (req, res) => {
  try {
    startSSE(res)

    cacheClient['test'] = res
    setTimeout(() => {
      res.write('okokoko')
      // res.write("data: " + 'opened' + '\n\n');
    }, 1000)



  } catch (error) {
    console.log("🩲 🩲 => app.get => error:", error)

  }
});

app.post('/api/sse/send', async (req, res) => {
  try {
    const data = req.body.mnemonic

    if (typeof data !== 'string') {
      res.send('data must be a string')
      return
    }

    await cacheClient['test'].write("data: " + data + '\n\n')

    res.send('ok')

  } catch (error) {
    console.log("🩲 🩲 => app.post => error:", error)

  }
})

app.get('/api/sse/integration/:partner/:id', async (req, res) => {
  startSSE(res)

  const { partner, id } = req.params
  if (!partner || !id) {
    res.status(400).write('Partner or id cannot be empty')
    return
  }

  const uniqKey = getUniqKey(partner, id)
  cacheIntegrationClient[uniqKey] = res

  res.write('start gateway integration\n\n')
})

const sendJSONData = (data, uniqKey) => {
  const cloneData = JSON.parse(JSON.stringify(data))
  cacheIntegrationClient[uniqKey].write('data:' + '{' + '\n')

  Object.entries(cloneData)
    .forEach(([key, value], index, arr) => {
      let prefix = ',\n'
      if (index === arr.length - 1) {
        prefix = '\n'
      }
      cacheIntegrationClient[uniqKey].write('data: ' + `"${key}": ` + JSON.stringify(value) + prefix)
    })
  cacheIntegrationClient[uniqKey].write('data:' + '}' + '\n\n')
}

const sendResponse = () => {

}

app.post('/api/sse/integration/:partner/:id', async (req, res) => {
  const { partner, id } = req.params
  if (!partner || !id) {
    res.status(400).send('Partner or id cannot be empty')
    return
  }
  const uniqKey = getUniqKey(partner, id)

  if (typeof req.body === 'string') {
    cacheIntegrationClient[uniqKey].write('data:' + req.body + '\n')
    return
  }

  sendJSONData(req.body, uniqKey)


  // cacheIntegrationClient[uniqKey].write('data:', 'idd: "coin98"', '\n')
  // cacheIntegrationClient[uniqKey].write('data:', '}', '\n\n')

  res.send('ok')
})

app.get('/api/sse/extension/:partner/:id', async (req, res) => {
  startSSE(res)
  const { partner, id } = req.params
  if (!partner || !id) {
    res.status(400).send('Partner or id cannot be empty')
    return
  }
  const uniqKey = getUniqKey(partner, id)

  // cacheEventIntegrationClient[]

  res.write('start events integration\n\n')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});