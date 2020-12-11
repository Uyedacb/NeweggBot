# NeweggBuyer
Autonomously buy GPUs from Newegg as soon as they become available. Forked from https://github.com/Ataraksia/NeweggBot. The bot is designed to buy the first available GPU it finds in the given list of GPUs (look at Configuration section under 'iten_number'). It will not buy multiple cards (unless in a combo). This bot is NOT designed to be run 24/7. It was designed to be ran when Newegg announces a drop on Twitter. With a little fiddling you could get it to run when notified. Try it out. I dare you.

This bot is very much still in the early stages, and more than a little rough around the edges.  Expect the occasional hiccups if you decide to use it. I recommend trying it out before a GPU drop so that you don't run into any unexpected issues.

## Fore-warning
I hate scalpers, please don't abuse this. USE WITH CAUTION! If you're desperately trying to get a card, don't put all your hopes and dreams into this bot. I would recommend running this on the side while you try to buy it manually in another window with a different account. 

Oh why scalpers why?

## Installation
You will require [Node.js 14](https://nodejs.org/en/) to run this. Check if Node is installed by typing this into your terminal:
```
node -v
npm -v
```
Make sure that the version number given after using "node -v" is greater than 14.

After installing this repository, via git or by downloading the code and extracting it, navigate to the folder where the files are located via powershell(or equivalent console) and run `npm install puppeteer -PUPPETEER_PRODUCT=firefox`.  If you end up experiencing the error `Error: Could not find browser revision latest` when running, you may also need to run the command `PUPPETEER-PRODUCT=firefox npm i puppeteer`.

## Configuration
Once that is finished, create a copy of config_template.json and name it config.json.  Inside you will find the very basic customization options.  
- `cv2` refers to the three digit code on the back of your credit card.  
- `refresh_time` refers to the duration to wait in seconds between add-to-cart attempts.  
- `item_number` refers to Newegg's item number found at the end of the card page URL.  For example, the item number for 'https://www.newegg.com/evga-geforce-rtx-3080-10g-p5-3897-kr/p/N82E16814487518' is N82E16814487518.  This bot can check for an available GPU to buy by putting a list of card models into the array.  For example, ['N82E16814487518','N82E16814137598'], the bot will search Newegg to see if it can buy the first or second GPU. This bot will stop when the first available item in your list is added. Combo items work as well. The item number for this combo, https://www.newegg.com/Product/ComboDealDetails?ItemList=Combo.4206685, is 'Combo.4206685'. This might work with other Newegg IDs, be creative and try it out.

A list of 3060ti GPUs and 3060ti combos are already provided. The bot iterates through the list from beginnning to end and then restarts if no items are added.

- `auto_submit` refers to whether or not you want the bot to complete the checkout process.  Setting it to 'true' will result in the bot completing the purchase, while 'false' will result in it completing all the steps up to but not including finalizing the purchase.  It is mostly intended as a means to test that the bot is working without actually having it buy something. The default value is false.

THE BOT WILL NOT AUTOMATICALLY BUY THE CARD. YOU MUST CHANGE THE AUTO_SUBMIT FIELD TO "true" IN config.json.
## Usage
After installation and configuration, the bot can then be run by using `node neweggbot.js`. MAKE SURE your cart is EMPTY or the bot will not work. The bot will ask you for permission to start search. Enter in any character to begin the search process. If a pop up appears, feel free to exit it.

It is important if you've never used your Newegg account before that you setup your account with a valid address and payment information, and then run through the checkout process manually making any changes to shipping and payment as Newegg requests.  You don't need to complete that purchase, just correct things so that when you click `Secure Checkout` from the cart, it brings you to `Review`, not `Shipping` or `Payment`. See image below:

![Alt Text](./img/neweggcart.gif)

At the moment, in the event that a card comes in stock, but goes out of stock before the bot has been able to complete the purchase, it will likely break, and you will need to restart it.  In general, there are very likely to be occasional issues that break the bot and require you to restart it.

## Common/Known Problems
Sometimes the bot will get stuck in the buying process. Press Ctrl+C while in your terminal to stop the bot and proceed to complete the checkout manually. 
I recommend doing this if your in the middle of a buy and don't have time to troubleshoot.

The bot does not exit properly, you must close your terminal or stop the script with Ctrl+C after the bot completely finishes purchasing.

Having a non-empty cart will confuse the bot and skip the search process.

Sometimes unexpected pop-ups asking if you want a specific item will stop the bot from progressing. Press Ctrl+C in the terminal, pray, and begin checking out manually.

Unexpected POPUPS will completely destroy the bot. If the bot doesn't look like its progressing, then you know what to do^.