const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
var admin = require("firebase-admin");

// doctors-portal-3461f-firebase-adminsdk-q7zcm-9c0acc9feb

serviceAccount = require('./doctors-portal-3461f-firebase-adminsdk-q7zcm-9c0acc9feb.json');

const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG);
adminConfig.credential = admin.credential.cert(serviceAccount);
admin.initializeApp(adminConfig);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k8hkv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function verifyToken(req, res, next) {
    if (req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1]

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email
        }
        catch {

        }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db("doctors-portal");
        const appointmentDb = database.collection('appointments');
        const usersDb = database.collection('users');


        app.post('/appointment', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentDb.insertOne(appointment);
            res.json(result)
        })
        app.get('/appointments', verifyToken, async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            console.log(date);
            const query = { email: email, date: date }
            const cursor = appointmentDb.find(query)
            const appointments = await cursor.toArray(cursor);
            res.json(appointments)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersDb.insertOne(user);
            res.json(result)
            console.log(result);
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersDb.findOne(query)
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user }
            const result = await usersDb.updateOne(filter, updateDoc, options);
            res.json(result)
        })

        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail
            if (requester) {
                const requesterAccount = await usersDb.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } }
                    const result = await usersDb.updateOne(filter, updateDoc)
                    res.json(result)
                }
            }

            res.status(403).json({ message: 'You dont have admin access' });

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