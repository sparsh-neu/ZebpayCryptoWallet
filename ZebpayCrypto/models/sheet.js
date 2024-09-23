const mongoose = require('mongoose')

const sheetSchema = new mongoose.Schema({

    bank_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref : 'Bank',
        required : true
    },
    cryptocurrency : {
        type : String,
        required : true
    },
    usdt_value : {
        type : Number
    },
    amount : {
        type : Number,
        required : true
    },
    total_balance : {
        type : Number
    }
})

module.exports = mongoose.model('Sheet',sheetSchema)