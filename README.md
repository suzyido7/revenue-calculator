# Revenue Calculator

## Purpose
This project contains 4 parts: Server, Client, Data processor and DB

### Server
* will have 2 apis to save customer revenue into files and to get revenue to the customer
* save new revenue data - POST api/liveEvent
* get revenue data for a given id - GET /api/liveEvent/:id

### Client
* The client will send revenue data that it reads from a local file events.jsonl
* The file needs to be created manually and contain data in the correct format
* The client will truncate the file after each processing

### Data processor
* The Data processor will read all the valid files, process them and save in the DB
* A file is considered valid if it is in the expected file name format and it if is at least 1 second old
* After processing the files will be deleted

### DB
* The Database in use is postgres installed locally
* To create the tables needed, execute in postgres DB the script located at db_create_table_script.txt

### Running
Run the following commands:

```bash
npm install             // install all modules 
npm start               // this will run the server
npm run start-client    // this will run the client
npm run start-processor // this will run the data processor
```
