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

const getStatus = async (card, browser) => {
  const page = await browser.newPage();
  await page.goto(card.url);
  await page.type('.product-buy-box', 'Headless Chrome');
  let html = await page.content();
  const dom = new JSDOM(html);
  let elem = dom.window.document.querySelector('.product-buy-box .btn-primary');
  return !!((elem && elem.childNodes[0].nodeValue.trim().toLowerCase().match('add to cart')));
}

const mainCheck = async (chatId) => {
  const browser = await puppeteer.launch();
  for (const card of cards) {
    const isInStock = await getStatus(card, browser);
    if (isInStock) {
      if (card.skip) continue;
      const msg = `✅  ${card.name} - IN STOCK \n${card.url}`;
      sendMessage(msg);
    }
  }

  lastCheck = moment().format();
  await browser.close();
}
setInterval(mainCheck.bind('248334115'), 60000);
// mainCheck('248334115');