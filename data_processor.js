import fs from 'fs'
import pkg from 'pg';
const { Client } = pkg

const timeToWaitInMilis = 10000
const processingInterval = 5000

const fileStartsWith = 'event-'
console.log("Data Processor started...")

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'wdwdiitrID7!',
  })
await client.connect()

const isFileValid = (fileName) => {
    if(fileName.startsWith(fileStartsWith)) {
        const fileCreationTime = fileName.substring(fileStartsWith.length)
        return Date.now() - parseInt(fileCreationTime) > timeToWaitInMilis
    }
    return false
}

const processEventFiles = () => {
    console.log(`Reading all events files from ./`)
    fs.readdir('./', (err, files) => {
        const validFiles = files.filter(file => isFileValid(file))
        console.log(`Filtering all files that might not be ready for processing - ${files.length - validFiles.length} were filtered`)
        const revenueMap = createRevenueMap(validFiles)
        createDBRevenueMap(revenueMap, validFiles)
    });    
}

const createRevenueMap = (files) => {
    const revenueMap = {}
    for(let file of files) {
        const fileName = `./${file}`
        const data = fs.readFileSync(fileName, { encoding: 'utf8', flag: 'r' });
        const dataObj = JSON.parse(data)
        if(!revenueMap.hasOwnProperty(dataObj.userId)) {
            if(dataObj.name === "add_revenue") {
                revenueMap[dataObj.userId] = dataObj.value
            }
            else if(dataObj.name === "subtract_revenue") {
                revenueMap[dataObj.userId] = -dataObj.value
            }
        }
        else {
            if(dataObj.name === "add_revenue") {
                revenueMap[dataObj.userId] += dataObj.value
            }
            else if(dataObj.name === "subtract_revenue") {
                revenueMap[dataObj.userId] -= dataObj.value
            }
        }
    }
    return revenueMap
}

const updateDBwithFinalRevenueMap = async (finalRevenueMap, files) => {
    for(let item of Object.keys(finalRevenueMap)) {
        const query = `INSERT INTO user_revenue (user_id, revenue) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET revenue = excluded.revenue`
        await client.query(query, [item, finalRevenueMap[item]])
    }
    if(files) {
        for (const file of files) {
            fs.unlink(file, (err) => {
            if (err) throw err;
            });
        }
    }
    console.log(`Processing of ${files.length} is done`)
    setTimeout(processEventFiles, processingInterval)
}

const createDBRevenueMap = async (revenueMap, validFiles) => {
    let params = ""
    const revenueMapKeys = Object.keys(revenueMap)
    if(revenueMapKeys.length === 0) {
        console.log(`No new events for processing. Will sleep for ${processingInterval/1000} seconds and contiune`)
        setTimeout(processEventFiles, processingInterval)
        return
    }
    for(let key of revenueMapKeys) {
        params += `'${key}',`
    }
    params = params.slice(0, -1)
    const query = `SELECT user_id, revenue FROM user_revenue WHERE user_id IN (${params})`
    const res = await client.query(query)
    const finalRevenueMap = createFinalRevenueMap(revenueMap, res.rows)
    updateDBwithFinalRevenueMap(finalRevenueMap, validFiles)
}

const createFinalRevenueMap = (revenueMap, dbRevenueMap) => {
    for(let key of Object.keys(revenueMap)) {
        const res = dbRevenueMap.find(item => item.user_id === key)
        if(res) {
            revenueMap[key] += parseFloat(res.revenue)
        }
    }
    return revenueMap
}

setTimeout(processEventFiles, 0)
