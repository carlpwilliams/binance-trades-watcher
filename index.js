
const moment = require('moment');
const chalk = require('chalk');
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: '<key>',
    APISECRET: '<secret>'
});

const testTable = {}
let buyCount = 0;
let buyTotal = 0;
let sellCount = 0;
let sellTotal = 0;
let tradeSecond = 0;
console.info(chalk.blue('starting'))
binance.websockets.trades(['ETHUSDT'], (trades) => {

    let { e: eventType, E: eventTime, s: symbol, p: price, q: quantity, m: maker, a: tradeId } = trades;
    const theMoment = moment(eventTime).format('mm:ss');

    if (!maker) {
        buyCount = buyCount + 1;
        buyTotal = buyTotal + parseInt(quantity);
        sellCount = 0;

        sellTotal = 0;

    }
    else {
        sellCount = sellCount + 1;
        sellTotal = sellTotal + parseInt(quantity);
        buyCount = 0
        buyTotal = 0;
    }
    let message = `${maker ? sellCount.toString().padEnd(3) + ' Sell'.padEnd(7) : buyCount.toString().padEnd(3) + ' Buy'.padEnd(7)}: ${quantity.padEnd(12)}  @ ${price.padEnd(10)}. ${maker ? sellTotal : buyTotal}`;

    if (maker) {
        message = chalk.red(message)
    }
    else { message = chalk.green(message); }
    if (quantity > 10) {
        if (quantity > 10) {
            message = chalk.bold(message)
        }

    }
    console.info(message);

    // console.info(moment(eventTime).format('mm:ss'))
    // console.table(testTable)
});