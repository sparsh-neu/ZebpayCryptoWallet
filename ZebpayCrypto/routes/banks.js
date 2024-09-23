const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Bank = require('../models/bank')
const Sheet = require('../models/sheet')


const axios = require('axios');

const cmc_api_key = '03026ded-15ea-4d40-835c-1d886c4fc35c'

router.get('/:id', async(req,res) => {
    try{
           const bank = await Bank.findById(req.params.id)
        //    bank.transactionInProgress = 'true'
        //    const b1 = await bank.save()
           
           res.json(bank)

        //    bank.transactionInProgress = 'false'
        //    const b2 = await bank.save()
    }catch(err){
        res.send('Error ' + err)
    }
})


router.post('/', async(req,res) => {

    const bank = Bank({user_id : req.body.user_id})

    try{
        const b1 =  await bank.save() 
        res.json(b1)
    }catch(err){
        res.send('Error')
    }
})

router.get('/', async(req,res) => {
    try{
           const banks = await Bank.find()
           res.json(banks)
    }catch(err){
        res.send('Error ' + err)
    }
})


router.post('/:id/submit', async(req,res) => {
    try{
        const bank = await Bank.findById(req.params.id)  //add transactionInProgress condition in main codes
        const bankid = req.params.id

        let response = null;
        var json;
        const crypto = req.body.cryptocurrency
        const sheetmain = await Sheet.findOne({bank_id : bankid, cryptocurrency : req.body.cryptocurrency})

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
            //reject(ex);
        }
        if (response) {
            // success

            
            json = response.data.data[crypto];
            //console.log(json);
            //resolve(json);
        }

        if (json == null){
            res.send('Invalid Crytocurrency')
          } else {
            if (sheetmain !== null) {
                sheetmain.amount = sheetmain.amount + req.body.amount
                sheetmain.total_balance = sheetmain.usdt_value * sheetmain.amount
                await sheetmain.save()
                const sheet_full = await Sheet.find({bank_id : req.params.id})
                bank.balance = [sheet_full]
                const b1 = await bank.save()
                res.send(b1) 
            } else {
                const sheet = new Sheet(
                    req.body
                )
                sheet.bank_id = bankid
                sheet.usdt_value = json.quote.USD.price
                sheet.total_balance = sheet.usdt_value * sheet.amount
                const s1 = await sheet.save()
                const sheet_full2 = await Sheet.find({bank_id : req.params.id})
                bank.balance = [sheet_full2]
                const b1 = await bank.save()
                res.send(b1)   
            }
        }
        // const b1 = await bank.save()
        // res.json(b1)   
    }catch(err){
        res.send('Error: ' + err)
    }
})


router.post('/:id/deposit', async(req,res) => {
    try{
        const bank = await Bank.findById(req.params.id)  //add transactionInProgress condition in main codes
        const bankid = req.params.id
        const sheetmain = await Sheet.findOne({bank_id : bankid, cryptocurrency : req.body.cryptocurrency})
        if (sheetmain !== null) {
            sheetmain.amount = sheetmain.amount + req.body.amount
            sheetmain.total_balance = sheetmain.usdt_value * sheetmain.amount
            await sheetmain.save()
            const sheet_full = await Sheet.find({bank_id : req.params.id})
            bank.balance = [sheet_full]
            const b1 = await bank.save()
            res.send(b1) 
        } else {
            const sheet = new Sheet(
                req.body
            )
            sheet.bank_id = bankid
            sheet.usdt_value = 1000
            sheet.total_balance = sheet.usdt_value * sheet.amount
            const s1 = await sheet.save()
            const sheet_full2 = await Sheet.find({bank_id : req.params.id})
            bank.balance = [sheet_full2]
            const b1 = await bank.save()
            res.send(b1)   
        }
        // const b1 = await bank.save()
        // res.json(b1)   
    }catch(err){
        res.send('Error: ' + err)
    }
})

router.post('/:id/withdraw', async(req,res) => {
    try{
        const bank = await Bank.findById(req.params.id) //add transactionInProgress condition in main codes
        const bankid = req.params.id
        const sheetmain = await Sheet.findOne({bank_id : bankid, cryptocurrency : req.body.cryptocurrency})
        if (sheetmain !== null) {
            if ((sheetmain.amount - req.body.amount) > 0){
                sheetmain.amount = sheetmain.amount - req.body.amount
                sheetmain.total_balance = sheetmain.usdt_value * sheetmain.amount
                await sheetmain.save()
                const sheet_full = await Sheet.find({bank_id : req.params.id})
                bank.balance = [sheet_full]
                const b1 = await bank.save()
                res.send(b1) 
            } else if ((sheetmain.amount - req.body.amount) == 0) {
                const crpto_del = await Sheet.findOneAndDelete({bank_id : bankid, cryptocurrency : req.body.cryptocurrency})
                const sheet_full = await Sheet.find({bank_id : req.params.id})
                bank.balance = [sheet_full]
                const b1 = await bank.save()
                res.send(b1) 
            } else {
                res.send('Not enough balance for withdrawal')
            }
        } else {
            res.send(req.body.cryptocurrency + ' Invalid Crypto or Crypto not available for withdrawal')
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
        const bank1 = await Bank.findById(id1) //add transactionInProgress condition in main codes
        const bank2 = await Bank.findById(id2) //add transactionInProgress condition in main codes
        const sheet1 = await Sheet.findOne({bank_id : id1, cryptocurrency : crypto}) //from
        const sheet2 = await Sheet.findOne({bank_id : id2, cryptocurrency : crypto}) //to

        if (sheet1 !== null) {

            if(sheet1.amount - amt > 0){
                //withdrawal
                sheet1.amount = sheet1.amount - req.body.amount
                sheet1.total_balance = sheet1.usdt_value * sheet1.amount
                const s1 = await sheet1.save()
                const sheet_full1 = await Sheet.find({bank_id : id1})
                bank1.balance = [sheet_full1]
                const b1 = await bank1.save()

                //deposit
                if (sheet2 !== null) {
                    sheet2.amount = sheet2.amount + req.body.amount
                    sheet2.total_balance = sheet2.usdt_value * sheet2.amount
                    const s2 = await sheet2.save()
                    const sheet_full2 = await Sheet.find({bank_id : id2})
                    bank2.balance = [sheet_full2]
                    const b2 = await bank2.save() 
                    const result = {
                        from_wallet_id : id1,
                        to_wallet_id : id2,
                        balance : [{ from_wallet : s1 , to_wallet : s2}]
                    }
                    res.json(result)
                } else {
                    const sheet = new Sheet({
                        cryptocurrency : crypto,
                        amount : amt
                    })
                    sheet.bank_id = id2
                    sheet.usdt_value = 1000
                    sheet.total_balance = sheet.usdt_value * sheet.amount
                    const s2 = await sheet.save()
                    const sheet_full2 = await Sheet.find({bank_id : id2})
                    bank2.balance = [sheet_full2]
                    const b2 = await bank2.save()   
                    const result = {
                        from_wallet_id : id1,
                        to_wallet_id : id2,
                        balance : [{ from_wallet : s1 , to_wallet : s2}]
                    }
                    res.json(result)               
                }
            } else if ((sheet1.amount - amt) == 0) {
                //withdrawal
                const crpto_del = await Sheet.findOneAndDelete({bank_id : id1, cryptocurrency : crypto})
                const sheet_full = await Sheet.find({bank_id : id1})
                bank1.balance = [sheet_full]
                const b1 = await bank1.save() 

                //deposit
                if (sheet2 !== null) {
                    sheet2.amount = sheet2.amount + req.body.amount
                    sheet2.total_balance = sheet2.usdt_value * sheet2.amount
                    const s2 = await sheet2.save()
                    const sheet_full2 = await Sheet.find({bank_id : id2})
                    bank2.balance = [sheet_full2]
                    const b2 = await bank2.save() 

                    const result = {
                        from_wallet_id : id1,
                        to_wallet_id : id2,
                        balance : [{ from_wallet : [] , to_wallet : s2}]
                    }
                    res.json(result)     
                } else {
                    const sheet = new Sheet({
                        cryptocurrency : crypto,
                        amount : amt
                    })
                    sheet.bank_id = id2
                    sheet.usdt_value = 1000
                    sheet.total_balance = sheet.usdt_value * sheet.amount
                    const s2 = await sheet.save()
                    const sheet_full2 = await Sheet.find({bank_id : id2})
                    bank2.balance = [sheet_full2]
                    const b2 = await bank2.save()     
                    
                    const result = {
                        from_wallet_id : id1,
                        to_wallet_id : id2,
                        balance : [{ from_wallet : [] , to_wallet : s2}]
                    }
                    res.json(result)     
                }
            } else {
                res.send('Not enough balance for transfer')
            }
        } else {
            res.send(crypto + ' crypto not available for transfer')
        }
    } catch(err) {
        res.send('Error: ' + err)
    }
})



router.post('/shift', async(req,res) => {
    try {
        const id1 = req.body.from_wallet_id //from
        const id2 = req.body.to_wallet_id //to
        const crypto = req.body.crypto
        const amt = req.body.amount
        const bank1 = await Bank.findById(id1) //add transactionInProgress condition in main codes
        const bank2 = await Bank.findById(id2) //add transactionInProgress condition in main codes
        const sheet1 = await Sheet.findOne({bank_id : id1, cryptocurrency : crypto}) //from
        const sheet2 = await Sheet.findOne({bank_id : id2, cryptocurrency : crypto}) //to

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
            //reject(ex);
        }
        if (response) {
            // success

            
            json = response.data.data[crypto];
            //console.log(json);
            //resolve(json);
        }

        if (json == null){
            res.send('Invalid Crytocurrency')
          } else {
                if (sheet1 !== null) {

                    if(sheet1.amount - amt > 0){
                        //withdrawal
                        sheet1.amount = sheet1.amount - req.body.amount
                        sheet1.total_balance = sheet1.usdt_value * sheet1.amount
                        const s1 = await sheet1.save()
                        const sheet_full1 = await Sheet.find({bank_id : id1})
                        bank1.balance = [sheet_full1]
                        const b1 = await bank1.save()

                        //deposit
                        if (sheet2 !== null) {
                            sheet2.amount = sheet2.amount + req.body.amount
                            sheet2.total_balance = sheet2.usdt_value * sheet2.amount
                            const s2 = await sheet2.save()
                            const sheet_full2 = await Sheet.find({bank_id : id2})
                            bank2.balance = [sheet_full2]
                            const b2 = await bank2.save() 
                            const result = {
                                from_wallet_id : id1,
                                to_wallet_id : id2,
                                balance : [{ from_wallet : s1 , to_wallet : s2}]
                            }
                            res.json(result)
                        } else {
                            const sheet = new Sheet({
                                cryptocurrency : crypto,
                                amount : amt
                            })
                            sheet.bank_id = id2
                            sheet.usdt_value = json.quote.USD.price
                            sheet.total_balance = sheet.usdt_value * sheet.amount
                            const s2 = await sheet.save()
                            const sheet_full2 = await Sheet.find({bank_id : id2})
                            bank2.balance = [sheet_full2]
                            const b2 = await bank2.save()   
                            const result = {
                                from_wallet_id : id1,
                                to_wallet_id : id2,
                                balance : [{ from_wallet : s1 , to_wallet : s2}]
                            }
                            res.json(result)               
                        }
                    } else if ((sheet1.amount - amt) == 0) {
                        //withdrawal
                        const crpto_del = await Sheet.findOneAndDelete({bank_id : id1, cryptocurrency : crypto})
                        const sheet_full = await Sheet.find({bank_id : id1})
                        bank1.balance = [sheet_full]
                        const b1 = await bank1.save() 

                        //deposit
                        if (sheet2 !== null) {
                            sheet2.amount = sheet2.amount + req.body.amount
                            sheet2.total_balance = sheet2.usdt_value * sheet2.amount
                            const s2 = await sheet2.save()
                            const sheet_full2 = await Sheet.find({bank_id : id2})
                            bank2.balance = [sheet_full2]
                            const b2 = await bank2.save() 

                            const result = {
                                from_wallet_id : id1,
                                to_wallet_id : id2,
                                balance : [{ from_wallet : [] , to_wallet : s2}]
                            }
                            res.json(result)     
                        } else {
                            const sheet = new Sheet({
                                cryptocurrency : crypto,
                                amount : amt
                            })
                            sheet.bank_id = id2
                            sheet.usdt_value = json.quote.USD.price
                            sheet.total_balance = sheet.usdt_value * sheet.amount
                            const s2 = await sheet.save()
                            const sheet_full2 = await Sheet.find({bank_id : id2})
                            bank2.balance = [sheet_full2]
                            const b2 = await bank2.save()     
                            
                            const result = {
                                from_wallet_id : id1,
                                to_wallet_id : id2,
                                balance : [{ from_wallet : [] , to_wallet : s2}]
                            }
                            res.json(result)     
                        }
                    } else {
                        res.send('Not enough balance for transfer')
                    }
                } else {
                    res.send(crypto + ' Crypto not available for transfer')
                }
            }
    } catch(err) {
        res.send('Error: ' + err)
    }
})

router.get('/:id/balance', async(req,res) => {
    try{
        const sheet = await Sheet.find({bank_id : req.params.id})
        res.json(sheet)
    } catch(err){
        res.send('Error: ' + err)
    }
})

module.exports = router