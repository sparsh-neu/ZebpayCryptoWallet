const mongoose = require('mongoose')
//const Sheet = require('../models/sheet')

// const sheetSchema = new mongoose.Schema({

//     bank_id : {
//         type: mongoose.Schema.Types.ObjectId
//     },
//     cryptocurrency : {
//         type : String
//     },
//     usdt_value : {
//         type : Number
//     },
//     amount : {
//         type : Number
//     },
//     total_balance : {
//         type : Number
//     }

// })

const bankSchema = new mongoose.Schema({

    user_id : {
        type: mongoose.Schema.Types.ObjectId, 
        ref : 'User'
    },
    years : {
        type: Number
    },
    balance :  ['Sheet'] ,
    transactionInProgress : {
        type : Boolean,
        default : false
    }

})

// const sheetSchema = new mongoose.Schema({

//     bank_id : {
//         type: mongoose.Schema.Types.ObjectId, 
//         ref : 'Bank',
//         required : true
//     },
//     cryptocurrency : {
//         type : String,
//         required : true
//     },
//     usdt_value : {
//         type : Number
//     },
//     amount : {
//         type : Number,
//         required : true
//     },
//     total_balance : {
//         type : Number
//     }

// })

//module.exports = mongoose.model('Sheet',sheetSchema)
module.exports = mongoose.model('Bank',bankSchema)