const express = require('express')
const mongoose = require('mongoose')
const url = 'mongodb://localhost/ZebpayCryptoProjectDBv2'

const app = express()

mongoose.connect(url, {useNewUrlParser:true})
const con = mongoose.connection

con.on('open', () => {
    console.log('connected...')
})

app.use(express.json())

const userRouter = require('./routes/users')
app.use('/users',userRouter)

// const bankRouter = require('./routes/banks')
// app.use('/banks',bankRouter)

const walletRouter = require('./routes/wallets')
app.use('/wallets',walletRouter)

app.listen(9000, () => {
    console.log('Server started')
})

