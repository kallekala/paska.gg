const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const UserSchema = new Schema ({
    googleID: {
        type:String,
    },
    
    firstName: {
        type: String
    },

    lastName: {
        type: String 
    },

    image: {
        type: String 
    },

    name: {
        type: String, 
    }, 
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
    },

    date: {
        type: Date,
        default: Date.now
    },

    memberOrganizations:[{
        type: Schema.Types.ObjectId,
        ref:'organizations',
}],

    admin:{
        type: Boolean,
        default: false
    }

});

//luo model. eka argumentti toimii myös collectionin nimenä mihin tulee menemään
mongoose.model('users', UserSchema);

