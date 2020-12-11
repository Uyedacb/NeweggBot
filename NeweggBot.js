const puppeteer = require('puppeteer')
const config = require('./config.json')
const readline = require("readline");
const { exit, title } = require('process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.on("close", function() {
    console.log("\nBYE BYE !!!");
    process.exit(0);
});

async function report (log) {
	currentTime = new Date();
	console.log(currentTime.toString().split('G')[0] + ': ' + log)
}
async function readLine() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise(resolve => {

			rl.question('continue? ', (answer) => {
				rl.close();
				resolve(answer)
			});
	})
}
async function run () {
	await report("Started")
	const browser = await puppeteer.launch({
        	headless: false,
			product: 'firefox',
        	defaultViewport: { width: 1366, height: 768 }
    	})
    const page = await browser.newPage()
	
    while (true) {
		await page.goto('https://secure.newegg.com/NewMyAccount/AccountLogin.aspx?nextpage=https%3a%2f%2fwww.newegg.com%2f' , {waitUntil: 'load' })
		if (page.url().includes('signin')) {
			await page.waitForSelector('button.btn.btn-orange')
			await page.type('#labeled-input-signEmail', config.email)
			await page.click('button.btn.btn-orange')
			await page.waitForTimeout(1500)
			try {
				await page.waitForSelector('#labeled-input-signEmail', {timeout: 500})
			} catch (err) {
				try {
					await page.waitForSelector('#labeled-input-password' , {timeout: 2500})
					await page.waitForSelector('button.btn.btn-orange')
					await page.type('#labeled-input-password', config.password)
					await page.click('button.btn.btn-orange')
					await page.waitForTimeout(1500)
					try {
						await page.waitForSelector('#labeled-input-password', {timeout: 500})
					} catch (err) {
						break
					}
				} catch (err) {
					report("Manual authorization code required by Newegg.  This should only happen once.")
					while (page.url().includes('signin'))
					{
						await page.waitForTimeout(500)
					}
					break
				}
			}
		} else if (page.url().includes("areyouahuman")) {
			await page.waitForTimeout(1000)
		}
	}

	await report("Logged in")
	await report("Type in any characters and press enter to begin searching for GPUs")
	await readLine();
	await report("Checking for card")
	var index = 0;
	let continueTo = true;
	while (continueTo)
	{
		try {
			await Promise.all([
				page.goto('https://secure.newegg.com/Shopping/AddtoCart.aspx?Submit=ADD&ItemList=' + config.item_number[index]),
				page.waitForNavigation()
			])
			if (page.url().includes("shop/cart")) {
				let titleSect = await page.$('#cart-top .row-title-note')
				let numItems = await page.evaluate((el) => el.textContent, titleSect);
				if (numItems.includes('0')) {
					report("item not added");
					index++;
					if (index == config.item_number.length) {
						index = 0;
						report('restarting order')
					}
					continue
				} else {
					break;
				}
			} else if (page.url().includes("ShoppingItem")) {
				// goes to shopping cart
				await Promise.all([
					page.goto('https://secure.newegg.com/shop/cart', { waitUntil: 'load' }),
					page.waitForNavigation()
				])
				// add modal check (probably redundant as the checkout button is in the DOM even when the Modal is open)
				try {
					await page.waitForSelector('#Popup_Masks', {timeout: 500});
					await page.click("#Popup_Masks button[class='close']");
				} catch (err) {
					report(err)
				}
				break;
			} 
			 else 
			if (page.url().includes("areyouahuman")) {
				await page.waitForTimeout(1000)
			}
		} catch (err) {
			report(err)
		}
	}
	await report ('checking out')
	// move to checkout page
	try {
		await Promise.all([
			page.evaluate(() => {document.querySelector(".summary-actions .btn.btn-primary.btn-wide").click()}),
			page.waitForNavigation()
		])
	} catch (err) {
		report(err)
	}
	try {
		//CHECKS IF BUTTONS ARE VISIBLE IF NOT, SKIP TO AUTO SUBMIT
		await page.waitForSelector('.checkout-step-action', {timeout: 1500, visible: true})
		const contButtons = await page.$$('.btn.btn-primary.checkout-step-action-done.layout-quarter')
		report(contButtons);
		for (let i = 0; i < 3; i++) {
			let buttonNode = contButtons[i];
			if (i == 2) {
				// fill cvv
				try {
					await page.waitForSelector('.form-text.mask-cvv-4', {timeout: 500})
					await page.type('.form-text.mask-cvv-4', config.cv2)
				} catch(err) {
					report(err)
					//open readline for manual checkout
				}
			}
			await page.evaluate((button) => {button.click()}, buttonNode);
			await page.waitForTimeout(1500);
		}
	} catch (err) {
		report(err)

	} finally {
		// if enabled in config menu, bot will auto purchase item
		if (config.auto_submit == 'true') {
			try {
				await Promise.all([
					page.waitForSelector('.summary-actions', {timeout: 1000, visible: true}),
					page.evaluate(() => {document.querySelector("#btnCreditCard").click()}),
					page.waitForNavigation()
				])
			} catch (err) {
				report(err)
			}
		}
		while (true) {
			let answer = await readLine();
			if (answer == "y" || answer == "yes" || answer == "yy") {
				await browser.close();
				break;
			}
		}
		exit();
	}
}

run()