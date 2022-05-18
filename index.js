const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k8hkv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const database = client.db("doctors-portal");
        const appointmentDb = database.collection('appointments');

        app.post('/appointment', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentDb.insertOne(appointment);
            res.json(result)
        })
        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            console.log(date);
            const query = { email: email ,date:date}
            const cursor = appointmentDb.find(query)
            const appointments = await cursor.toArray(cursor);
            res.json(appointments)
        })
    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Doctors portal')
})

app.listen(port, () => {
    console.log('listening to port 5000');
})