
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
    "60": { "buy": 0, start: new Date(), "sell": 0 },
    "300": { "buy": 0, start: new Date(), "sell": 0 },
    "900": { "buy": 0, start: new Date(), "sell": 0 }
};

const timeSince = (date) => {
    var diff = Math.abs(new Date(date) - new Date()) / 1000;
    // console.info(diff);
    return diff;

}
console.clear();

const getEpochSummary = (seconds) => {
    const timeString = moment(new Date()).format("hh:mm:ss ");
    let buy = Math.ceil(epochTotals[seconds].buy);
    let sell = Math.ceil(epochTotals[seconds].sell);
    let buyText = boldIfLarger(buy, sell, buy);
    let sellText = boldIfLarger(sell, buy, sell);

    let epochSummary = `${seconds / 60}m -> ${chalk.green(buyText)} - ${chalk.red(sellText)}`.padEnd(60);

    if (timeSince(epochTotals[seconds].start) > seconds) {
        if (seconds == 60)
            console.info(chalk.blue.bold(timeString.padEnd(100, '-')));
        epochTotals[seconds] = { "buy": 0, start: new Date(), "sell": 0 };
    }

    return epochSummary;
}

const outputGrid = (trades) => {

    let { e: eventType, E: eventTime, s: symbol, p: price, q: quantity, m: maker, a: tradeId } = trades;
    let epochSummary = ``;

    epochSummary = getEpochSummary(60);

    epochSummary = epochSummary + getEpochSummary(300)

    epochSummary = epochSummary + getEpochSummary(900)

    if (!maker) {
        buyValues.push(quantity);
        buyValues = buyValues.reverse().slice(0, 1000).reverse();
        totalBuys = buyValues.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);

        epochTotals['60'].buy = epochTotals['60'].buy + parseFloat(quantity);
        epochTotals['300'].buy = epochTotals['300'].buy + parseFloat(quantity);
        epochTotals['900'].buy = epochTotals['900'].buy + parseFloat(quantity);

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



        epochTotals['60'].sell = epochTotals['60'].sell + parseFloat(quantity);
        epochTotals['300'].sell = epochTotals['300'].sell + parseFloat(quantity);
        epochTotals['900'].sell = epochTotals['900'].sell + parseFloat(quantity);

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

        // process.stdout.write(chalk.red("o"));
    }
    else {
        message = chalk.green(message);
        // process.stdout.write(chalk.green("o")); 
    }
    if (quantity > 10) {
        message = chalk.bold(message)
    }
    if (quantity > 50) {
        message = chalk.underline(message);
    }
    let output = `${message.padEnd(60)} ${epochSummary}`
    return output;
    // console.info(moment(eventTime).format('mm:ss'))
    // console.table(testTable)
}

let buys = []
let sells = []
let buysMA100 = 0;
let sellsMa100 = 0;
let count = 0;
outputOther = (trades) => {

    let { e: eventType, E: eventTime, s: symbol, p: price, q: quantity, m: maker, a: tradeId } = trades;

    if (!maker) {
        const { source, total } = addAndGetTotal(buys, quantity)
        buys = source;
        buysMA100 = total;
    }
    else {
        const { source, total } = addAndGetTotal(sells, quantity)
        sells = source;
        sellsMa100 = total;
    }
    const buysP = (buysMA100 / (buysMA100 + sellsMa100)) * 50
    const sellsP = 50 - buysP;
    let range = chalk.green(numberOfLetters('o', buysP)) + chalk.red(numberOfLetters('o', sellsP));

    return range;
    //return `buys: ${chalk.green(buysMA100)} (${buys.length}) - sells: ${chalk.green(sellsMa100)} (${sells.length})`;
    console.info(`buys: ${chalk.green(buysMA100)} (${buys.length}) - sells: ${chalk.green(sellsMa100)} (${sells.length})`)
    // console.table(trades);
}
const numberOfLetters = (letter, number) => {
    let ret = '';
    for (i = 0; i < number; i++) {
        ret = ret + letter;
    }
    return ret;
}

function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
}

const addAndGetTotal = (source, quantity) => {
    source.push(quantity);
    source = source.reverse().splice(0, 100).reverse();
    let total = source.reduce((partialSum, a) => parseFloat(partialSum) + parseFloat(a), 0);
    if (total > 0) total = Math.round(total * 100) / 100
    return { source, total };
}

binance.websockets.trades(['LTCUSDT'], (trades) => {
    const gridmsg = outputGrid(trades);
    const ma100Msg = outputOther(trades);
    console.info(`[${ma100Msg}]      ${gridmsg}`);
});

const boldIfLarger = (firstValue, secondValue, text) => {
    if (firstValue > secondValue) {
        return chalk.bold.underline(text)
    }
    return text;
}