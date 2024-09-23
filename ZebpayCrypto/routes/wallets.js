const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Wallet = require('../models/wallet')
const Balance = require('../models/balance')

const axios = require('axios');

const cmc_api_key = '03026ded-15ea-4d40-835c-1d886c4fc35c'


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
    try{
        const wallet = await Wallet.findById(req.params.id)  //add transactionInProgress condition in main codes
        if ( wallet.transactionInProgress !== true){

            wallet.transactionInProgress = true
            const w = await wallet.save()
            const walletid = req.params.id

            // const userid = wallet.user_id
            // const user = await User.findById(userid)

            let response = null;
            var json;
            const crypto = req.body.cryptocurrency
            const balancemain = await Balance.findOne({wallet_id : walletid, cryptocurrency : req.body.cryptocurrency})

            const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=' + crypto
            try {
                response = await axios.get(url, {
                headers: {
                    'X-CMC_PRO_API_KEY': cmc_api_key,
                },
                });
            } catch(ex) {
                response = null;
                // error
                console.log(ex);
            }
            if (response) {
                // success
                json = response.data.data[crypto];
            }

            if (json == null){

                wallet.transactionInProgress = false
                const w1 = await wallet.save()

                // const wallet_full2 = await Wallet.find({user_id : userid})
                // user.wallets = [wallet_full2]
                // const u2 = await user.save()

                res.send('Invalid Crytocurrency')
            } else {
                if (balancemain !== null) {
                    balancemain.amount = balancemain.amount + req.body.amount
                    balancemain.total_balance = balancemain.usdt_value * balancemain.amount
                    await balancemain.save()
                    const balance_full = await Balance.find({wallet_id : req.params.id})
                    wallet.balance = [balance_full]
                    wallet.transactionInProgress = false
                    const w1 = await wallet.save()

                    // const wallet_full = await Wallet.find({user_id : userid})
                    // user.wallets = [wallet_full]
                    // const u1 = await user.save()

                    res.send(w1) 
                } else {
                    const balance = new Balance(
                        req.body
                    )
                    balance.wallet_id = walletid
                    balance.usdt_value = json.quote.USD.price
                    balance.total_balance = balance.usdt_value * balance.amount
                    const b1 = await balance.save()
                    const balance_full2 = await Balance.find({wallet_id : req.params.id})
                    wallet.balance = [balance_full2]
                    wallet.transactionInProgress = false
                    const w1 = await wallet.save()

                    // const wallet_full2 = await Wallet.find({user_id : userid})
                    // user.wallets = [wallet_full2]
                    // const u2 = await user.save()

                    res.send(w1)   
                }
            }
        } else {
            res.send('Wallet is currently in transaction')
        }
        
    }catch(err){
        res.send('Error: ' + err)
    }
})


router.post('/:id/withdraw', async(req,res) => {
    try{
        const wallet = await Wallet.findById(req.params.id) //add transactionInProgress condition in main codes

        if ( wallet.transactionInProgress !== true) {
            const walletid = req.params.id

            wallet.transactionInProgress = true
            const w = await wallet.save()

            // const userid = wallet.user_id
            // const user = await User.findById(userid)

            const balancemain = await Balance.findOne({wallet_id : walletid, cryptocurrency : req.body.cryptocurrency})
            if (balancemain !== null) {
                if ((balancemain.amount - req.body.amount) > 0){
                    balancemain.amount = balancemain.amount - req.body.amount
                    balancemain.total_balance = balancemain.usdt_value * balancemain.amount
                    await balancemain.save()
                    const balance_full = await Balance.find({wallet_id : req.params.id})
                    wallet.balance = [balance_full]
                    wallet.transactionInProgress = false
                    const w1 = await wallet.save()

                    // const wallet_full = await Wallet.find({user_id : userid})
                    // user.wallets = [wallet_full]
                    // const u1 = await user.save()

                    res.send(w1) 
                } else if ((balancemain.amount - req.body.amount) == 0) {
                    const crpto_del = await Balance.findOneAndDelete({wallet_id : walletid, cryptocurrency : req.body.cryptocurrency})
                    const balance_full = await Balance.find({wallet_id : req.params.id})
                    wallet.balance = [balance_full]
                    wallet.transactionInProgress = false
                    const w1 = await wallet.save()

                    // const wallet_full2 = await Wallet.find({user_id : userid})
                    // user.wallets = [wallet_full2]
                    // const u2 = await user.save()

                    res.send(w1) 
                } else {
                    wallet.transactionInProgress = false
                    const w1 = await wallet.save()

                    // const wallet_full2 = await Wallet.find({user_id : userid})
                    // user.wallets = [wallet_full2]
                    // const u2 = await user.save()

                    res.send('Not enough balance for withdrawal')
                }
            } else {
                wallet.transactionInProgress = false
                const w1 = await wallet.save()

                // const wallet_full2 = await Wallet.find({user_id : userid})
                // user.wallets = [wallet_full2]
                // const u2 = await user.save()
                res.send(req.body.cryptocurrency + ' : Invalid Crypto or Crypto not available for withdrawal')
            }
        } else {
            res.send('Wallet is currently in transaction')
        }
    } catch(err){
        res.send('Error: ' + err)
    }
})


router.post('/transfer', async(req,res) => {
    try {
        const id1 = req.body.from_wallet_id //from
        const id2 = req.body.to_wallet_id //to
        const crypto = req.body.crypto
        const amt = req.body.amount
        const wallet1 = await Wallet.findById(id1) //add transactionInProgress condition in main codes
        const wallet2 = await Wallet.findById(id2) //add transactionInProgress condition in main codes

        

        if ( wallet1.transactionInProgress !== true && wallet2.transactionInProgress !== true && id1 !== id2){

            wallet1.transactionInProgress = true
            wallet2.transactionInProgress = true

            // const userid1 = wallet1.user_id
            // const user1 = await User.findById(userid1)

            // const userid2 = wallet2.user_id
            // const user2 = await User.findById(userid2)


            const balance1 = await Balance.findOne({wallet_id : id1, cryptocurrency : crypto}) //from
            const balance2 = await Balance.findOne({wallet_id : id2, cryptocurrency : crypto}) //to

            let response = null;
            var json;

            const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=' + crypto
            try {
                response = await axios.get(url, {
                headers: {
                    'X-CMC_PRO_API_KEY': cmc_api_key,
                },
                });
            } catch(ex) {
                response = null;
                // error
                console.log(ex);
            }
            if (response) {
                // success
                json = response.data.data[crypto];
            }

            if (json == null){

                wallet1.transactionInProgress = false
                //wallet1.user_id = userid1
                const w1 = await wallet1.save()

                wallet2.transactionInProgress = false
                //wallet2.user_id = userid2
                const w2 = await wallet2.save()

                res.send('Invalid Crytocurrency')
            } else {
                    if (balance1 !== null) {

                        if(balance1.amount - amt > 0){
                            //withdrawal

                            balance1.amount = balance1.amount - req.body.amount
                            balance1.total_balance = balance1.usdt_value * balance1.amount
                            const b1 = await balance1.save()
                            const balance_full = await Balance.find({wallet_id : id1})
                            wallet1.balance = [balance_full]
                            wallet1.transactionInProgress = false
                            //wallet1.user_id = userid1
                            const w1 = await wallet1.save()

                            // const wallet_full = await Wallet.find({user_id : userid1})
                            // user1.wallets = [wallet_full]
                            // const u1 = await user1.save()
                            


                            

                            //deposit
                            if (balance2 !== null) {
                                balance2.amount = balance2.amount + req.body.amount
                                balance2.total_balance = balance2.usdt_value * balance2.amount
                                const b2 = await balance2.save()
                                const balance_full2 = await Balance.find({wallet_id : id2})
                                wallet2.balance = [balance_full2]
                                wallet2.transactionInProgress = false
                                //wallet2.user_id = userid2
                                const w2 = await wallet2.save()

                                // const wallet_full2 = await Wallet.find({user_id : userid2})
                                // user2.wallets = [wallet_full2]
                                // const u2 = await user2.save()

                                const result = {
                                    from_wallet_id : id1,
                                    to_wallet_id : id2,
                                    balance : [{ from_wallet : b1 , to_wallet : b2}]
                                }
                                res.json(result)
                            } else {
                                const balance = new Balance({
                                    cryptocurrency : crypto,
                                    amount : amt
                                })
                                balance.wallet_id = id2
                                balance.usdt_value = json.quote.USD.price
                                balance.total_balance = balance.usdt_value * balance.amount
                                const b2 = await balance.save()
                                const balance_full2 = await Balance.find({wallet_id : id2})
                                wallet2.balance = [balance_full2]
                                wallet2.transactionInProgress = false
                                //wallet2.user_id = userid2
                                const w1 = await wallet2.save()
            
                                // const wallet_full2 = await Wallet.find({user_id : userid2})
                                // user2.wallets = [wallet_full2]
                                // const u2 = await user2.save()

                                const result = {
                                    from_wallet_id : id1,
                                    to_wallet_id : id2,
                                    balance : [{ from_wallet : b1 , to_wallet : b2}]
                                }
                                res.json(result)
                            }
                        } else if ((balance1.amount - amt) == 0) {
                            //withdrawal
                            const crpto_del = await Balance.findOneAndDelete({wallet_id : id1, cryptocurrency : req.body.cryptocurrency})
                            const balance_full = await Balance.find({wallet_id : id1})
                            wallet1.balance = [balance_full]
                            wallet1.transactionInProgress = false
                            //wallet1.user_id = userid1
                            const w1 = await wallet1.save()

                            // const wallet_full2 = await Wallet.find({user_id : userid1})
                            // user2.wallets = [wallet_full2]
                            // const u2 = await user2.save()

                            

                            //deposit
                            if (balance2 !== null) {
                                
                                balance2.amount = balance2.amount + req.body.amount
                                balance2.total_balance = balance2.usdt_value * balance2.amount
                                const b2 = await balance2.save()
                                const balance_full2 = await Balance.find({wallet_id : id2})
                                wallet2.balance = [balance_full2]
                                wallet2.transactionInProgress = false
                                //wallet2.user_id = userid2
                                const w2 = await wallet2.save()

                                // const wallet_full2 = await Wallet.find({user_id : userid2})
                                // user2.wallets = [wallet_full2]
                                // const u2 = await user2.save()

                                const result = {
                                    from_wallet_id : id1,
                                    to_wallet_id : id2,
                                    balance : [{ from_wallet : [] , to_wallet : b2}]
                                }
                                res.json(result)  
                                

                                
                            } else {
                                
                                const balance = new Balance({
                                    cryptocurrency : crypto,
                                    amount : amt
                                })
                                balance.wallet_id = id2
                                balance.usdt_value = json.quote.USD.price
                                balance.total_balance = balance.usdt_value * balance.amount
                                const b2 = await balance.save()
                                const balance_full2 = await Balance.find({wallet_id : id2})
                                wallet2.balance = [balance_full2]
                                wallet2.transactionInProgress = false
                                //wallet2.user_id = userid2
                                const w1 = await wallet2.save()
            
                                // const wallet_full2 = await Wallet.find({user_id : userid2})
                                // user2.wallets = [wallet_full2]
                                // const u2 = await user2.save()
                                
                                const result = {
                                    from_wallet_id : id1,
                                    to_wallet_id : id2,
                                    balance : [{ from_wallet : [] , to_wallet : b2}]
                                }
                                res.json(result)  
                                
                                
                            }
                        } else {

                            wallet1.transactionInProgress = false
                            //wallet1.user_id = userid1
                            const w1 = await wallet1.save()

                            // const wallet_full = await Wallet.find({user_id : userid1})
                            // user1.wallets = [wallet_full]
                            // const u1 = await user1.save()

                            wallet2.transactionInProgress = false
                            //wallet2.user_id = userid2
                            const w2 = await wallet2.save()
        
                            // const wallet_full2 = await Wallet.find({user_id : userid2})
                            // user2.wallets = [wallet_full2]
                            // const u2 = await user2.save()
                            
                            

                            res.send('Not enough balance for transfer')
                        }
                    } else {

                        wallet1.transactionInProgress = false
                        //wallet1.user_id = userid1
                        const w1 = await wallet1.save()

                        // const wallet_full = await Wallet.find({user_id : userid1})
                        // user1.wallets = [wallet_full]
                        // const u1 = await user1.save()

                        wallet2.transactionInProgress = false
                        //wallet2.user_id = userid2
                        const w2 = await wallet2.save()
    
                        // const wallet_full2 = await Wallet.find({user_id : userid2})
                        // user2.wallets = [wallet_full2]
                        // const u2 = await user2.save()

                        
                        
                        res.send(crypto + ' Crypto not available for transfer')
                    }

                    
                }
        } else {
            res.send('One or both Wallets are currently in transaction')
        }
    } catch(err) {
        res.send('Error: ' + err)
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