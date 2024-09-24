const mongoose = require('mongoose')

const cryptoSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    usdt_value : {
        type : Number,
        required : true
    }

})

module.exports = mongoose.model('Crypto',cryptoSchema)