// Cache model for managing cache data

import mongoose from 'mongoose';


const cacheSchema = new mongoose.Schema({

    url : {
        type: String,
        required: true,
        unique: true,
    },
    data: {
        type: String,
        required: true,
    },
    }, {
    timestamps: true,   
});

const Cache = mongoose.model('Cache', cacheSchema);
export default Cache;
