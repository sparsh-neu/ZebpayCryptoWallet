const mongoose = require('mongoose')

const balanceSchema = new mongoose.Schema({

    wallet_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref : 'Wallet',
        required : true
    },
    cryptocurrency : {
        type : String,
        required : true
    },
    amount : {
        type : Number,
        required : true
    },
    usdt_value : {
        type : Number
    },
    total_balance : {
        type : Number
    }
})

module.exports = mongoose.model('Balance',balanceSchema)