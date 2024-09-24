const express = require('express')
const mongoose = require('mongoose')
const axios = require('axios')
const url = 'mongodb://localhost/ZebpayCryptoProjectDBDemo'

const cmc_api_key = '03026ded-15ea-4d40-835c-1d886c4fc35c'

const Crypto = require('./models/crypto')

const app = express()

mongoose.connect(url, {useNewUrlParser:true})
const con = mongoose.connection

const arr = ["BTC", "ETH", "USDT"]

con.on('open', async () => {

    for (const cryptoname of arr) {
        let response = null;
        var json;
        const crypton = cryptoname
       
        const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=' + crypton
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
            json = response.data.data[crypton].quote.USD.price;
        }
    
        const cryp = await Crypto.findOne({name : cryptoname})
        if (cryp !== null){
            try{
            cryp.usdt_value = json
            await cryp.save()
            } catch (err) {
                console.log(err)
            }
        } else {
            const cs = new Crypto({
            name: cryptoname,
            usdt_value : json
            })
            await cs.save()
        }
    }
    console.log('connected...')
})

app.use(express.json())

const userRouter = require('./routes/users')
app.use('/users',userRouter)

const walletRouter = require('./routes/wallets')
app.use('/wallets',walletRouter)

app.listen(9000, () => {
    console.log('Server started')
})

