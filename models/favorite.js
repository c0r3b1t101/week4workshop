const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favoriteSchema = new Schema({
    user:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:'User'
    },
    campsites:[{
        type:mongoose.SchemaTypes.ObjectId,
        ref:'Campsite'
    }]
});

const Favorite = mongoose.model('Favorite',favoriteSchema);

module.exports = Favorite;
