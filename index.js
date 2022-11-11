const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;

// middle Wars 
app.use(cors());
app.use(express.json());

// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASSWORD)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0ww6vlu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){
    const authHeader=req.headers.authorization;
    if(!authHeader){
        res.status(401).send({message:'unauthorized access'})
    }
    const token =authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECTRET,function(err,decoded){
        if(err){
            res.status(401).send({message:'unauthorized access'})
        }
        req.decoded=decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('doorStep').collection('services')
        const ReviewCollection = client.db('doorStep').collection('reviews')
        app.post('/jwt',(req,res)=>{
            const user =req.body
            const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECTRET,{expiresIn:'7d'})
            res.send({token})
        })
        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query).sort({ currentTime: -1 });
            const services = await cursor.limit(3).toArray();
            res.send(services);
        })
        app.get('/allServices', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get("/allServices/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            console.log(query);
            res.send(service);
        });
        app.post("/allServices", async (req, res) => {
            const service = req.body;
            console.log(service);
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });
        app.post("/reviews", async (req, res) => {
            const review = req.body;
            console.log(review);
            const result = await ReviewCollection.insertOne(review);
            res.send(result);
        });
        app.get('/reviews', async (req, res) => {
            const query = {}
            const cursor = ReviewCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get("/reviews/:id", async (req, res) => {
            const id = req.params.id;
            const query = { service_id: id };
            const cursor = ReviewCollection.find(query);
            const result = await cursor.toArray();
            console.log(query);
            res.send(result);
        });
        app.get("/review/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = ReviewCollection.find(query);
            const result = await cursor.toArray();
            console.log(query);
            res.send(result);
        });
        app.patch("/review/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const updatedReview = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    message:updatedReview.message,
                },
            };
            const result = await ReviewCollection.updateOne(query,updateDoc,options);
            res.send(result);
        });
        app.delete("/review/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ReviewCollection.deleteOne(query);
            console.log(query);
            res.send(result);
        });
        app.get("/myreviews/:email",verifyJWT, async (req, res) => {
            // console.log(req.headers.authorization);
            const decoded=req.decoded;
            if(decoded.email!==req.params.email){
                res.status(403).send({message:'unauthorized access'})
            }
            const email = req.params.email;
            const query = { email: email };
            const cursor = ReviewCollection.find(query).sort({time:-1});
            const result = await cursor.toArray();
            console.log(query);
            res.send(result);
        });
        // app.get('/myreviews', async (req, res) => {
        //     const query = {}
        //     if (req.query.email) {
        //         query = {
        //             email: req.query.email
        //         }
        //     }
        //     const cursor = ReviewCollection.find(query);
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })


    }
    finally {

    }
}

run().catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('Door Step Server Running');
})

app.listen(port, () => {
    console.log(`Door Step Server Running on ${port}`);
})