const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const organizationSchema = new Schema ({
    name: {
        type: String, 
        required: true
    }, 

    details: {
        type: String,
    },

});

//luo model. eka argumentti toimii myös collectionin nimenä mihin tulee menemään
mongoose.model('organizations', organizationSchema);