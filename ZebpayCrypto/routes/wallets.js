const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Wallet = require('../models/wallet')
const Balance = require('../models/balance')
const Crypto = require('../models/crypto')

//deposit for exisiting crypto
async function dep_not_null(wallet, balance, crypto, id, amount){
    balance.amount = balance.amount + amount
    balance.usdt_value = crypto.usdt_value
    balance.total_balance = balance.usdt_value * balance.amount
    await balance.save()
    const balance_full = await Balance.find({wallet_id : id})
    wallet.balance = [balance_full]
    wallet.transactionInProgress = false
    const w1 = await wallet.save()
    return w1
}

//deposit for non existing crypto
async function dep_null(wallet, crypto, id, bodycrypto, amount){
    const balance = new Balance({
        cryptocurrency : bodycrypto,
        amount : amount
    })
    balance.wallet_id = id
    balance.usdt_value = crypto.usdt_value
    balance.total_balance = balance.usdt_value * balance.amount
    const b1 = await balance.save()
    const balance_full2 = await Balance.find({wallet_id : id})
    wallet.balance = [balance_full2]
    wallet.transactionInProgress = false
    const w1 = await wallet.save()
    return w1
}

//withdrawal with balance remaining
async function wd_not_null (wallet, balance, crypto, id, amount){
    balance.amount = balance.amount - amount
    balance.usdt_value = crypto.usdt_value
    balance.total_balance = balance.usdt_value * balance.amount
    await balance.save()
    const balance_full = await Balance.find({wallet_id : id})
    wallet.balance = [balance_full]
    wallet.transactionInProgress = false
    const w1 = await wallet.save()
    return w1
}

//withdrawal with no balance remaining
async function wd_null (wallet, walletid, bodycrypto) {
    const crpto_del = await Balance.findOneAndDelete({wallet_id : walletid, cryptocurrency : bodycrypto})
    const balance_full = await Balance.find({wallet_id : walletid})
    wallet.balance = [balance_full]
    wallet.transactionInProgress = false
    const w1 = await wallet.save()
    return w1
}


router.post('/', async(req,res) => {

    const user = await User.findById(req.body.user_id)
    if (user !== null) {

        const wallet = new Wallet({user_id : req.body.user_id})

        try{
            const w1 =  await wallet.save() 
            res.json(w1)
        }catch(err){
            res.send('Error : ' + err)
        }
    }else {
        res.send('User Id invalid as User does not exist')
    }
})


router.post('/:id/deposit', async(req,res) => {
    const wallet = await Wallet.findById(req.params.id)  //add transactionInProgress condition in main codes
    if(wallet !== null) {
        try{        
            if ( wallet.transactionInProgress !== true){

                wallet.transactionInProgress = true
                const w = await wallet.save()
                const walletid = req.params.id

                const balancemain = await Balance.findOne({wallet_id : walletid, cryptocurrency : req.body.cryptocurrency})

                const crypto = await Crypto.findOne({name : req.body.cryptocurrency})

                if (crypto == null){

                    wallet.transactionInProgress = false
                    const w1 = await wallet.save()

                    res.send('Invalid Crytocurrency')
                } else {
                    if (balancemain !== null) {
                        
                        const w1 = await dep_not_null(wallet,balancemain, crypto, walletid, req.body.amount)
                        res.send(w1) 
                    } else {
        
                        const w1 = await dep_null(wallet, crypto, walletid, req.body.cryptocurrency, req.body.amount)
                        res.send(w1)   
                    }
                }
            } else { 
                res.send('Wallet is currently in transaction')
            }
            
        }catch(err){
            const wallet = await Wallet.findById(req.params.id)
            wallet.transactionInProgress = false
            const w1 = await wallet.save()
            res.send('Error: ' + err)
        }
    } else {
        res.send('Invalid Wallet Id')
    }
})


router.post('/:id/withdraw', async(req,res) => {
    const wallet = await Wallet.findById(req.params.id) //add transactionInProgress condition in main codes
    if (wallet !== null) {
        try{            
            if ( wallet.transactionInProgress !== true) {
                const walletid = req.params.id

                wallet.transactionInProgress = true
                const w = await wallet.save()

                const balancemain = await Balance.findOne({wallet_id : walletid, cryptocurrency : req.body.cryptocurrency})
                const crypto = await Crypto.findOne({name : req.body.cryptocurrency})

                if (balancemain !== null && crypto !== null) {
                    if ((balancemain.amount - req.body.amount) > 0){     

                        const w1 = await wd_not_null(wallet, balancemain, crypto, walletid, req.body.amount)
                        res.send(w1) 

                    } else if ((balancemain.amount - req.body.amount) == 0) {      

                        const w1 = await wd_null(wallet, walletid, req.body.cryptocurrency)
                        res.send(w1) 

                    } else {

                        wallet.transactionInProgress = false
                        const w1 = await wallet.save()

                        res.send('Not enough balance for withdrawal')

                    }
                } else {

                    wallet.transactionInProgress = false
                    const w1 = await wallet.save()
                    res.send(req.body.cryptocurrency + ' : Invalid Crypto or Crypto not available for withdrawal')

                }
            } else {
                res.send('Wallet is currently in transaction')
            }
        } catch(err){

            const wallet = await Wallet.findById(req.params.id)
            wallet.transactionInProgress = false
            const w1 = await wallet.save()
            res.send('Error: ' + err)

        }
    } else {
        res.send('Invalid Wallet Id')
    }
})

router.post('/transfer', async(req,res) => {
    const id1 = req.body.from_wallet_id //from
    const id2 = req.body.to_wallet_id //to
    const wallet1 = await Wallet.findById(id1) //add transactionInProgress condition in main codes
    const wallet2 = await Wallet.findById(id2) //add transactionInProgress condition in main codes

    if ( wallet1 !== null && wallet2 !== null) {
        try {       
            const crypto = req.body.crypto
            const amt = req.body.amount 

            if ( wallet1.transactionInProgress !== true && wallet2.transactionInProgress !== true && id1 !== id2){

                wallet1.transactionInProgress = true
                wallet2.transactionInProgress = true

                const balance1 = await Balance.findOne({wallet_id : id1, cryptocurrency : crypto}) //from
                const balance2 = await Balance.findOne({wallet_id : id2, cryptocurrency : crypto}) //to

                const crypton = await Crypto.findOne({name : req.body.crypto})

                if (crypton == null){

                    wallet1.transactionInProgress = false
                    const w1 = await wallet1.save()

                    wallet2.transactionInProgress = false
                    const w2 = await wallet2.save()

                    res.send('Invalid Crytocurrency')

                } else {
                        if (balance1 !== null) {

                            if(balance1.amount - amt > 0){
                                
                                const w1 = await wd_not_null(wallet1, balance1, crypton, id1, req.body.amount)

                                const b1 = await Balance.findOne({wallet_id : id1, cryptocurrency : crypto})

                                //deposit
                                if (balance2 !== null) {

                                    const w2 = await dep_not_null(wallet2, balance2, crypton, id2, req.body.amount)

                                    const b2 = await Balance.findOne({wallet_id : id2, cryptocurrency : crypto})

                                    const result = {
                                        from_wallet_id : id1,
                                        to_wallet_id : id2,
                                        balance : [{ from_wallet : b1 , to_wallet : b2}]
                                    }
                                    res.json(result)

                                } else {

                                    const w2 = await dep_null(wallet2, crypton, id2, crypto, amt)

                                    const b2 = await Balance.findOne({wallet_id : id2, cryptocurrency : crypto})
                                    
                                    const result = {
                                        from_wallet_id : id1,
                                        to_wallet_id : id2,
                                        balance : [{ from_wallet : b1 , to_wallet : b2}]
                                    }
                                    res.json(result)

                                }
                            } else if ((balance1.amount - amt) == 0) {
                                //withdrawal
                                
                                const w1 = await wd_null(wallet1, id1, req.body.crypto)

                                //deposit
                                if (balance2 !== null) {

                                    const w2 = await dep_not_null(wallet2, balance2, crypton, id2, req.body.amount)

                                    const b2 = await Balance.findOne({wallet_id : id2, cryptocurrency : crypto})

                                    const result = {
                                        from_wallet_id : id1,
                                        to_wallet_id : id2,
                                        balance : [{ from_wallet : [] , to_wallet : b2}]
                                    }
                                    res.json(result)  
                                    
                                } else {
                                    
                                    const w2 = await dep_null(wallet2, crypton, id2, crypto, amt)

                                    const b2 = await Balance.findOne({wallet_id : id2, cryptocurrency : crypto})
                
                                    const result = {
                                        from_wallet_id : id1,
                                        to_wallet_id : id2,
                                        balance : [{ from_wallet : [] , to_wallet : b2}]
                                    }
                                    res.json(result)                                      
                                    
                                }
                            } else {

                                wallet1.transactionInProgress = false
                                const w1 = await wallet1.save()

                                wallet2.transactionInProgress = false
                                const w2 = await wallet2.save()

                                res.send('Not enough balance for transfer')

                            }
                        } else {

                            wallet1.transactionInProgress = false
                            const w1 = await wallet1.save()

                            wallet2.transactionInProgress = false
                            const w2 = await wallet2.save()
                            
                            res.send(crypto + ' Crypto not available for transfer')
                        }                        
                    }
            } else {
                res.send('One or both Wallets are currently in transaction')
            }
        } catch(err) {
            const id1 = req.body.from_wallet_id
            const id2 = req.body.to_wallet_id
            const wallet1 = await Wallet.findById(id1)
            const wallet2 = await Wallet.findById(id2)
            wallet1.transactionInProgress = false
            const w1 = await wallet1.save()
            wallet2.transactionInProgress = false
            const w2 = await wallet2.save()
            res.send('Error: ' + err)
        }
    } else {
        res.send('One or both Wallet Ids are invalid')
    }
})


router.get('/:id/balance', async(req,res) => {
    try{
        const balance = await Balance.find({wallet_id : req.params.id})
        res.json(balance)
    } catch(err){
        res.send('Error: ' + err)
    }
})

module.exports = router