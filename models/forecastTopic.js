const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const forecastTopicSchema = new Schema ({
    title: {
        type: String, 
        required: true
    }, 
    details: {
        type: String,
    },

    submittedBy: {
        type: String,
    },
    categories: [String],

    
    result: {
        type: String,
        default: "Unresolved"
    },

    user:{
        type: String,
        required:true
      },
    date: {
        type: Date,
        default: Date.now
    }
});

//luo model. eka argumentti toimii myös collectionin nimenä mihin tulee menemään
mongoose.model('forecastTopics', forecastTopicSchema);