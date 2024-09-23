/* Example in Node.js */
const axios = require('axios');


const cmc_api_key = '03026ded-15ea-4d40-835c-1d886c4fc35c'
let response = null;
var json;
const crypto = 'BTC'
new Promise(async (resolve, reject) => {
  
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
    reject(ex);
  }
  if (response) {
    // success

    
    json = response.data.data[crypto];
    //console.log(json);
    resolve(json);
  }
if (json == null){
  console.log('Invalid')
} else {
  console.log ('Price : ' + json.quote.USD.price)
}
  
});

