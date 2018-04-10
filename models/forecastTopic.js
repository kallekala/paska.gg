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

    // categories: [String],

    //resultin voi modaa booleaniksi
    // allowComments: {
    //     type: Boolean,
    //     default:true
    //   },
    
    result: {
        type: String,
        default: "Unresolved"
    },

forecasts: [{
    submittedBy: {
        type: String  
    },
    submittedProbability: {
        type:Number, 
        min: 0, 
        max: 100,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}],

user:{
    type: Schema.Types.ObjectId,
    ref:'users'
  },

comments: [{
    commentBody: {
      type: String,
      required: true
    },
    commentDate:{
      type: Date,
      default: Date.now
    },
    commentUser:{
      type: Schema.Types.ObjectId,
      ref:'users'
    }
  }]

});

//luo model. eka argumentti toimii myös collectionin nimenä mihin tulee menemään
mongoose.model('forecastTopics', forecastTopicSchema);