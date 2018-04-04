const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const express = require('express');
const app = express();
const moment = require('moment');
const puppeteer = require('puppeteer');
const Bot = require('telegram-api').default;
const Message = require('telegram-api/types/Message');

// const hostname = 'arcane-woodland-39898.herokuapp.com';
const port = process.env.PORT || 4000;
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
const chatIds = ['248334115', '1071583'];
bot.start();
sendMessage('STARTED');

bot.command('start', function(message) {

    bot.send(new Message().text('Use /check to check current stock').to(message.chat.id));
});

bot.command('check', function(message) {
    getStatus(message.chat.id);
});

function sendMessage(msg) {
    chatIds.map(function (id) {
        bot.send(new Message().text(msg).to(id));
    })
}


const cards = [
    // {id: '5094274700', name: 'TITAN Xp', skip: false},
    {id: '5094274900', name: '1080 TI', skip: false},
    {id: '2740204200', name: '1080', skip: false},
    {id: '5136449000', name: '1070 TI', skip: false},
    {id: '2740281000', name: '1070', skip: false},
    {id: '5056171200', name: '1060', skip: false}
];
function getStatus(id) {
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.nvidia.com/en-us/geforce/products/10series/geforce-store/');
        let html = await page.content();
        const dom = new JSDOM(html);
        let inStock = [];
        if (id) {
            cards.forEach(card => {
                let elem = dom.window.document.querySelector(`[data-digital-river-id="${card.id}"]`);
                let str = ((elem && elem.innerHTML.toLowerCase().match('add to cart')))
                    ? ' ✅   '
                    : ' ❌   ';
                str += `GTX ${card.name}`;
                inStock.push(str);
            });
            // let result = `----------------------------------\n`;
            let result = inStock.join(`\n\n`);
            // result += `\n----------------------------------`;
            bot.send(new Message().text(result).to(id));
        }
        else {
            cards.forEach(card => {
                if (card.skip) return;
                let elem = dom.window.document.querySelector(`[data-digital-river-id="${card.id}"]`);
                if ((elem && elem.innerHTML.toLowerCase().match('add to cart'))) {
                    inStock.push(`✅   GTX ${card.name} - IN STOCK`);
                    setTimeout(()=>card.skip = false, 80000);
                    setTimeout(()=>card.skip = false, 600000);
                }
            });
            if (inStock.length > 0) {
                // let result = `----------------------------------\n`;
                let result = '';
                result += inStock.join(`\n\n`);
                // result += `\n----------------------------------`;
                result += '\nhttps://www.nvidia.com/en-us/geforce/products/10series/geforce-store/';
                sendMessage(result);
            }
        }
        lastCheck = moment().format();
        await browser.close();
    })();
}
setInterval(getStatus, 30000);