import express from 'express'
import fs from 'fs'
import bodyParser from 'body-parser'
import pkg from 'pg';
const { Client } = pkg

const app = express()
const port = 3000
app.use(bodyParser.json())

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'wdwdiitrID7!',
})
await client.connect()

const auth = (req, res, next) => {
  try {
    if (req.headers.authorization !== 'secret') {
      throw 'Invalid user ID';
    } 
    else {
      next();
    }
  } 
  catch {
    console.log("Invalid request was sent")
    res.status(401).json({
      error: 'Invalid request!'
    });
  }
}

const handleNewEvent = (req, res) => {
  const event = JSON.stringify(req.body)
  const fileLocation = `./event-${Date.now()}`
  
  fs.writeFile(fileLocation, event, err => {
    if (err) {
        console.log(`Error writing file at ${fileLocation}`, err)
        return res.status(500).send("Internal Error");
    }
    res.send(event);
    console.log(`file ${fileLocation} was created`)
  })
}

const handleGetEvent = async (req, res) => {
  const { id } = req.params;
  const query = `SELECT user_id, revenue FROM user_revenue WHERE user_id IN ('${id}')`
  const usersData = await client.query(query)
  usersData.rows.length > 0 ? res.send(usersData.rows[0]) : res.send({});
}

app.post('/api/liveEvent', auth, (req, res) => handleNewEvent(req, res))
app.get('/api/liveEvent/:id', auth, (req, res) => handleGetEvent(req, res))

app.listen(port, () => {
  console.log(`server listening on port ${port}`)
})

