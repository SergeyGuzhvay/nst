const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const express = require('express');
const app = express();
const moment = require('moment');
const puppeteer = require('puppeteer');
const Bot = require('node-telegram-bot-api');

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

const token = '568473371:AAGUBn-QNXJEmuDrrYHo0cQgDnmLAnUy1b0';
const bot = new Bot(token, {polling: true});

const chatIds = ['248334115'];

function sendMessage(msg) {
  chatIds.map(function (id) {
    const opts = {parse_mode: 'Markdown'}
    bot.sendMessage(id, msg);
  })
}

sendMessage('STARTED');

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  mainCheck(chatId);
});


const cards = [
  {
    url: 'https://www.newegg.com/msi-geforce-rtx-4090-rtx-4090-gaming-trio-24g/p/N82E16814137762',
    name: 'RTX 4090 GAMING TRIO',
    skip: false
  },
  {
    url: 'https://www.newegg.com/msi-geforce-rtx-4090-rtx-4090-gaming-x-trio-24g/p/N82E16814137761',
    name: 'RTX 4090 GAMING X TRIO',
    skip: false
  },
  {
    url: 'https://www.newegg.com/msi-geforce-rtx-4090-rtx-4090-suprim-x-24g/p/N82E16814137760',
    name: 'RTX 4090 SUPRIM X',
    skip: false
  },
];

const mainUrl = 'https://www.newegg.com/p/pl?N=50001312%20100007709%208000%20601408874%20601303642';

const getStatus = async (browser) => {
  const inStock = [];
  const page = await browser.newPage();
  await page.goto(mainUrl);
  let html = await page.content();
  const dom = new JSDOM(html);
  let grid = dom.window.document.querySelector('.items-grid-view');
  if (grid) {
    const items = [...grid.querySelectorAll('.item-cell')];
    const itemsInStock = items.filter(item => item.querySelector('.item-button-area .btn-primary')?.childNodes[0].nodeValue.trim().toLowerCase() === 'add to cart')
    itemsInStock.forEach(cardEl => {
      const title = cardEl.querySelector('.item-title');
      inStock.push({name: title.text, url: title.href})
    })
  }
  return inStock;
}

const mainCheck = async (chatId) => {
  const browser = await puppeteer.launch();
  const inStockArray = await getStatus(browser);
  for (const card of inStockArray) {
    const msg = `✅  ${card.name} \n${card.url}`;
    sendMessage(msg);
  }


  lastCheck = moment().format();
  await browser.close();
}
// setInterval(mainCheck.bind('248334115'), 60000);
mainCheck('248334115');