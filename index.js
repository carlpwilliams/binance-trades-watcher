
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
let sellValues = []
let buyValues = []
let totalBuys = 0;
let totalSells = 0;
let maBuys = 0;
let maSells = 0;
let epochTotals = {
    "minute": { "buy": 0, start: new Date(), "sell": 0 },
    "5minute": { "buy": 0, start: new Date(), "sell": 0 },
    "15minute": { "buy": 0, start: new Date(), "sell": 0 },
    "1hr": { "buy": 0, start: new Date(), "sell": 0 }
};

const timeSince = (date) => {
    var diff = Math.abs(new Date(date) - new Date()) / 1000;
    // console.info(diff);
    return diff;

}
console.clear();
binance.websockets.trades(['ETHUSDT'], (trades) => {

    let { e: eventType, E: eventTime, s: symbol, p: price, q: quantity, m: maker, a: tradeId } = trades;
    
    let epochSummary = ``;
    epochSummary = epochSummary + `1m -> ${chalk.green(Math.ceil(epochTotals.minute.buy))} - ${chalk.red(Math.ceil(epochTotals.minute.sell))}`.padEnd(30)
    if (timeSince(epochTotals.minute.start) > 60) {
        epochTotals.minute = { "buy": 0, start: new Date(), "sell": 0 };
    }

    epochSummary = epochSummary.padEnd(45) + `5m -> ${chalk.green(Math.ceil(epochTotals['5minute'].buy))} - ${chalk.red(Math.ceil(epochTotals['5minute'].sell))}`.padEnd(30)
    if (timeSince(epochTotals['5minute'].start) > 300) {
        epochTotals['5minute'] = { "buy": 0, start: new Date(), "sell": 0 };
    }

    epochSummary = epochSummary.padEnd(90) + `15m -> ${chalk.green(Math.ceil(epochTotals['15minute'].buy))} - ${chalk.red(Math.ceil(epochTotals['15minute'].sell))}`.padEnd(30)
    if (timeSince(epochTotals['15minute'].start) > 900) {
        epochTotals['15minute'] = { "buy": 0, start: new Date(), "sell": 0 };
    }

    if (!maker) {
        buyValues.push(quantity);
        buyValues = buyValues.reverse().slice(0, 1000).reverse();
        totalBuys = buyValues.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);

        epochTotals.minute.buy = epochTotals.minute.buy + parseFloat(quantity);
        epochTotals['5minute'].buy = epochTotals['5minute'].buy + parseFloat(quantity);
        epochTotals['15minute'].buy = epochTotals['15minute'].buy + parseFloat(quantity);

        buyTotal = buyTotal + parseFloat(quantity);
        maBuys = Math.ceil(totalBuys / buyValues.length);
        buyCount = buyCount + 1;
        sellCount = 0;

        sellTotal = 0;

    }
    else {
        sellValues.push(quantity);
        sellValues = sellValues.reverse().slice(0, 100).reverse();
        totalSells = sellValues.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);



        epochTotals.minute.sell = epochTotals.minute.sell + parseFloat(quantity);
        epochTotals['5minute'].sell = epochTotals['5minute'].sell + parseFloat(quantity);
        epochTotals['15minute'].sell = epochTotals['15minute'].sell + parseFloat(quantity);

        sellCount = parseInt(sellCount) + 1;
        sellTotal = sellTotal + parseFloat(quantity);
        maSells = Math.ceil(totalSells / sellCount);

        buyCount = 0
        buyTotal = 0;
    }

    const guage = chalk.green("".padEnd(maBuys, "#")) + "|" + chalk.red("".padEnd(maSells, "#"))
    let message = `${maker ? sellCount.toString().padEnd(3) : buyCount.toString().padEnd(3)}: ${quantity.padEnd(12)}  @ ${price.padEnd(10)}. ${maker ? Math.round(sellTotal * 100) / 100 : Math.round(buyTotal * 100) / 100}`//.padEnd(100) //+ `${guage}`;

    if (maker) {
        message = chalk.red(message)
    }
    else { message = chalk.green(message); }
    if (quantity > 10) {
        message = chalk.bold(message)
    }
    if (quantity > 50) {
        message = chalk.underline(message);
    }
    let output = `${message.padEnd(60)} ${epochSummary}`
    console.info(output);

    // console.info(moment(eventTime).format('mm:ss'))
    // console.table(testTable)
});