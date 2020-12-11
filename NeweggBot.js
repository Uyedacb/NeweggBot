const puppeteer = require('puppeteer')
const config = require('./config.json')
const readline = require("readline");
const { exit, title } = require('process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var observer;
rl.on("close", function() {
    console.log("\nBYE BYE !!!");
    process.exit(0);
});

async function report (log) {
	currentTime = new Date();
	console.log(currentTime.toString().split('G')[0] + ': ' + log)
}

async function check_cart (page) {
	await page.waitForTimeout(250)
	try {
		await page.waitForSelector('span.amount' , { timeout: 1000 })
		var element = await page.$('span.amount')
		var text = await page.evaluate(element => element.textContent, element);
		// checks if price exceeds limit
		if (parseInt(text.split('$')[1]) > config.price_limit) {
			await report("Price exceeds limit, removing from cart")
			var button = await page.$$('button.btn.btn-mini');
			while (true) {
				try {
					await button[1].click()
				} catch (err) {
					break
				}
			}
			return false
		}
		await report("Card added to cart, attempting to purchase")
		return true
	} catch (err) {
		await report("Card not in stock")
		await page.waitForTimeout(config.refresh_time * 1000)
		return false
	}
}

async function readLine() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise(resolve => {

			rl.question('close? ', (answer) => {
				rl.close();
				resolve(answer)
			});
	})
}
// function doneLoading() {
// 	return new Promise(() => {
// 		observer = new MutationObserver( mutations => {
// 			puppeteerMutationListener();
// 			await page.waitForSelector('.checkout-step-action', {timeout: 3000})
// 			await page.evaluate(() => {document.querySelector(".checkout-step-action .btn.btn-primary.checkout-step-action-done.layout-quarter").click()})
//     });
//     observer.observe(target, { childList: true });
// 	})
// }
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
				// add modal check
				try {
					await page.waitForSelector('#Popup_Masks', {timeout: 2000});
					await page.click("#Popup_Masks button[class='close']");
				} catch (err) {
					report(err)
				}
				let titleSect = await page.$('#cart-top .row-title-note')
				let numItems = await page.evaluate((el) => el.textContent, titleSect);
				if (numItems.includes('0')) {
					index++;
					report("item not added");
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
				// add modal check
				try {
					await page.waitForSelector('#Popup_Masks', {timeout: 2000});
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
			// if (page.url().includes("ShoppingItem")) {
			// 	// goes to shopping cart
			// 	await page.goto('https://secure.newegg.com/Shopping/ShoppingCart.aspx', { waitUntil: 'load' })
				
			// 	// var check = await check_cart(page)
			// 	// if (check){
			// 	// 	break
			// 	// }
			// 	// const nextItem = await readLine();
			// 	// if (nextItem == "n") {
			// 	// 	continueTo = !continueTo
			// 	// } else {
			// 	// 	index++;
			// 	// }
			// 	break;
			// } else {
			// 	index++;
			// 	report("error thrown");
			// 	//page.dispose();
			// 	continue
			// }
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
	// try {
	// 	//await page.goto('javascript:attachDelegateEvent((function(){Biz.GlobalShopping.ShoppingCart.checkOut(\'True\')}))', {timeout: 500})
	// 	await page.waitForSelector('summary-actions')
	// 	await page.click('summary-actions button[class=btn]')
	// } catch (err) {
	// }
	
// 	while (true) {
// 		try {
// 			await page.waitForSelector('#cvv2Code' , {timeout: 500})
// 			await page.type('#cvv2Code', config.cv2)
// 			break
// 		} catch (err) {
// 		}
// 		try {
// 			await page.waitForSelector('#creditCardCVV2' , {timeout: 500})
// 			await page.type('#creditCardCVV2', config.cv2)
// 			break
// 		} catch (err) {
// 		}
// 	}

// 	try {
// 		await page.waitForSelector('#term' , {timeout: 5000})	
// 		await page.click('#term')
// 	} catch (err) {
// 	}

// 	if (config.auto_submit == 'true') {
// 		await page.click('#SubmitOrder')
// 	}
// 	await report("Completed purchase")
//     	//await browser.close()
// }

}
run()
