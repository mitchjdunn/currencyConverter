require('dotenv').config(); // read .env  files
const express = require('express');
const bodyParser = require('body-parser');

const { getRates, getHistorical, getSymbols, } = require('./lib/fixer-service');
const { convertCurrency } = require('./lib/free-currency-service');

const app = express();
const port = process.env.port || 3000;

// set public folder as root
app.use(express.static('public'));

// allow front-end access to node_modules folder
// Don't use single quotes for variables
app.use('/scripts', express.static(`${__dirname}/node_modules/`));

//listen for http requests on port 3000;
app.listen(port, () => {
    console.log('listening on %d', port);
});

// Parse Post data as url encoded dated
app.use(bodyParser.urlencoded({
    extended: true,
}));

// Pars POST data as JSON
app.use(bodyParser.json());

// Express Error handler
const errorHandler = (err, req, res) => {
    if(err.response) {
        // The rquest was made and the server responded with a status code
        // that falls out of the range of 2xx
        res.status(403).send({title: 'Server responded with an error', message: err.message });
    } else if (err.request) {
        // the request was made but no response was recieved
        res.status(503).send({title: 'unable to communicate with server', message: err.message });
    } else {
        // Something happend in setting up the request that triggered and error
        res.status(500).send({ title: 'An unexpected error occured', message: err.message});
    }
};

// Fetch Latest Currency Rates
app.get('/api/rates', async (req, res) => {
    try {
        const data = await getRates();
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        errorHAndler(error,req,re);
    }
});

// Fetch Symbols
app.get('/api/symbols', async (req, res) =>{
    try {

        const data = await getSymbols();
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// convert currency
app.post('/api/convert', async (req, res) => {
    try {
        const { from, to } = req.body;
        const data = await convertCurrency(from, to);
        res.setHeader('Content-Type', 'applicaiton/json');
        res.send(data);
    } catch (error) {
        errorHandler(error, req, res);
    }
});

app.post('/api/historical', async (req, res) => {
    try{
        const { date } = req.body;
        const data = await getHistorical(date);
        res.setHeader('Content-Type', 'applicaiton/json');
        res.send(data);
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

// const test = async() => {
//     const data = await getRates();
//     console.log(data);
// };

// Test Currency Conversion Endpoint
// const test = async() => {
//   const data = await convertCurrency('USD', 'KES');
//   console.log(data);
// }
// const test = async() => {
//   const data = await getHistorical('2012-07-14');
//   console.log(data);
// }
//  test();
