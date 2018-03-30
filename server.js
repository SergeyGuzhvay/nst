const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const express = require('express');
const app = express();
const moment = require('moment');
const puppeteer = require('puppeteer');
const Bot = require('telegram-api').default;
const Message = require('telegram-api/types/Message');

// const hostname = 'arcane-woodland-39898.herokuapp.com';
const port = process.env.PORT || 5000;
let lastCheck = null;
app.get('/', (request, response) => {
    response.send(`last check on: ${lastCheck}`);
});
app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${port}`)
});

let bot = new Bot({
    token: '568473371:AAGUBn-QNXJEmuDrrYHo0cQgDnmLAnUy1b0',
    update: {
        timeout: 0,
        offset: 0,
        limit: 100
    }
});
const chanId = '248334115';
bot.start();
bot.send(new Message().text('STARTED').to(chanId));

bot.command('start', function(message) {

    bot.send(new Message().text('Use /check to check current stock').to(chanId));
});

bot.command('check', function(message) {
    getStatus(true);
});

const cards = [
    {id: '5094274700', name: 'TITAN Xp', skip: false},
    {id: '5094274900', name: '1080 TI', skip: false},
    {id: '2740204200', name: '1080', skip: false},
    {id: '5136449000', name: '1070 TI', skip: false},
    {id: '2740281000', name: '1070', skip: false},
    {id: '5056171200', name: '1060', skip: false}
];
function getStatus(check) {
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.nvidia.com/en-us/geforce/products/10series/geforce-store/');
        let html = await page.content();
        const dom = new JSDOM(html);
        let inStock = [];
        if (check) {
            cards.forEach(card => {
                let elem = dom.window.document.querySelector(`[data-digital-river-id="${card.id}"]`);
                let str = (!(elem && elem.innerHTML.toLowerCase().match('out of stock')))
                    ? ' ✅   '
                    : ' ❌   ';
                str += `GTX ${card.name}`;
                inStock.push(str);
            });
            // let result = `----------------------------------\n`;
            let result = inStock.join(`\n\n`);
            // result += `\n----------------------------------`;
            bot.send(new Message().text(result).to(chanId));
        }
        else {
            cards.forEach(card => {
                if (card.skip) return;
                let elem = dom.window.document.querySelector(`[data-digital-river-id="${card.id}"]`);
                if (!(elem && elem.innerHTML.toLowerCase().match('out of stock'))) {
                    inStock.push(`✅   GTX ${card.name} - IN STOCK`);
                    card.skip = true;
                    setTimeout(()=>getStatus(true), 30000);
                    setTimeout(()=>getStatus(true), 60000);
                    setTimeout(()=>card.skip = false, 600000);
                }
            });
            if (inStock.length > 0) {
                // let result = `----------------------------------\n`;
                let result = '';
                result += inStock.join(`\n\n`);
                // result += `\n----------------------------------`;
                result += '\nhttps://www.nvidia.com/en-us/geforce/products/10series/geforce-store/';
                bot.send(new Message().text(result).to(chanId));
            }
        }
        lastCheck = moment().format();
        await browser.close();
    })();
}
setInterval(getStatus, 60000);