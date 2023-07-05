import fs from 'fs'
import fetch from 'node-fetch';

console.log("Client started...")

const eventUrl = 'http://localhost:3000/api/liveEvent'
const processingInterval = 5000
const eventsFile = './events.jsonl'

const headers = {
    'Authorization' : "secret",
    'Content-Type': 'application/json',
}

const sendEvent = async (userEvent) => {
    const response = await fetch(eventUrl, {
        method: 'post',
        body: userEvent,
        headers
    });
    const data = await response.json();
}

const processEventsFile = async () => {
    console.log(`Started processing events from file: ${eventsFile}`)
    fs.readFile(eventsFile, 'utf8', async (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        if(data === "") {
            console.log(`Nothing to process. Will sleep for ${processingInterval/1000} seconds and contiune`)
            setTimeout(processEventsFile, processingInterval)
            return
        }
        data = data.split('\n')
        for(let item of data) {
            await sendEvent(item)
        }
        fs.truncate(eventsFile, 0, function() { 
            console.log(`Done processing ${data.length} events from file: ${eventsFile}. Will sleep for ${processingInterval/1000} seconds and contiune`)
            setTimeout(processEventsFile, processingInterval)
        })
    })    
}

setTimeout(processEventsFile, 0)