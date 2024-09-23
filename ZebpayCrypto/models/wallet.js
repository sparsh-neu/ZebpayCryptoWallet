const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({

    user_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref : 'User',
        required : true
    },
    years : {
        type: Number
    },
    balance :  ['Balance'] ,
    transactionInProgress : {
        type : Boolean,
        default : false
    }

})


module.exports = mongoose.model('Wallet',walletSchema)