const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const submittedForecastSchema = new Schema ({
    title: {
        type: String, 
        // required: true
    }, 

    user:{
        type: Schema.Types.ObjectId,
        ref:'users'
      },
    
    submittedBy: {
        type: String,
    },

    submittedProbability: {
        type:Number, min: 0, max: 100,
    },

    details: {
        type: String,
    },

    categories: [String],
    
    //kuinka merkitä binary?
    result: {
        type: String,
        default: "Unresolved"
    },

    brierScore: {
    },

    date: {
        type: Date,
        default: Date.now
    }
});

//luo model. eka argumentti toimii myös collectionin nimenä mihin tulee menemään
mongoose.model('submittedForecasts', submittedForecastSchema);