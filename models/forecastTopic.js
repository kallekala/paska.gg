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

    options: {
        type: [],
    },

    status: {
        type: String,
        default: "Unresolved and open",
        required: true
    },

    open: {
        type:Boolean,
        default: true
    },

    user:{
        type: Schema.Types.ObjectId,
        ref:'users'
    },

    submits: [
    {
        user:{
            type: Schema.Types.ObjectId,
            ref:'users'    
        },
        
        submittedProbability:[{
            type:Number, min: 0, max: 100,
        }],

        brierScore: [{
            type: String,
            default: "Unresolved"
        }],

        date: {
            type: Date,
            default: Date.now
        }
    }],

    result: [],

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
    }],

    organizations: [
        {type: String,
        }
    ],

    visible: {
        type:Boolean,
        default: false
    },

    }, { versionKey: false });

//luo model. eka argumentti toimii myös collectionin nimenä mihin tulee menemään
mongoose.model('forecastTopics', forecastTopicSchema);