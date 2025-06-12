import express from 'express'
import cors from 'cors'
import  dotenv from 'dotenv'
import mongoose from 'mongoose';
import { getDocument } from './Controllers/Document.controller.js';
dotenv.config({path: './.env'})

const app = express();
app.use(express.json()); 


const port = process.env.PORT || 8000

console.log('Cors',process.env.CORS_ORIGIN);

app.use(cors()); 




app.get('/', (req, res) => {
  res.send('Welcome');
});

app.post('/api/query',  getDocument);
const db_name='codeorbit';
mongoose.connect(`${process.env.MONGODB_URI}${db_name}`)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, ()=>{
        console.log(`Surver running at http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

