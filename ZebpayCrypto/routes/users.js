const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Wallet = require('../models/wallet')
const Balance = require('../models/balance')
const { ObjectId } = require('mongodb')


router.get('/', async(req,res) => {
    try{
           const users = await User.find()
           res.json(users)
    }catch(err){
        res.send('Error ' + err)
    }
})

router.get('/:id', async(req,res) => {
    try{
           const user = await User.findById(req.params.id)
           res.json(user)
    }catch(err){
        res.send('Error ' + err)
    }
})

router.get('/:id/wallets', async(req,res) => {
    try{
        const wallets = await Wallet.find({user_id : req.params.id})
        res.json(wallets)
    }catch(err){
        res.send('Error ' + err)
    }
})


router.post('/', async(req,res) => {
    const user = new User({
        name: req.body.name,
        country: req.body.country
    })

    try{
        const u1 =  await user.save() 
        res.json(u1)
    }catch(err){
        res.send('Error')
    }
})

router.post('/:id/update',async(req,res)=> {
    try{
        const user = await User.findById(req.params.id) 
        user.country = req.body.country
        const a1 = await user.save()
        res.json(a1)   
    }catch(err){
        res.send('Error')
    }
 })

 router.post('/update',async(req,res)=> {
    try{
        var user = await User.findOne({name : req.body.name}) 
        if (user != null){
            user.country = req.body.country
        } else {
            user = new User({
                name: req.body.name,
                country: req.body.country
            })
        }
        const a1 = await user.save()
        res.json(a1)   
    }catch(err){
        res.send('Error : ' + err)
    }
 })

module.exports = router