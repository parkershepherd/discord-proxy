import puppeteer from 'puppeteer'
import * as dotenv from 'dotenv'
import chalk from 'chalk'
dotenv.config()

const IGNORE_USERNAMES = (process.env.IGNORE_USERNAMES || '').split(',')

if (!process.env.DISCORD_USERNAME || !process.env.DISCORD_PASSWORD || !process.env.DISCORD_CHANNEL) {
    console.log(chalk.red(`DISCORD_USERNAME, DISCORD_PASSWORD, and DISCORD_CHANNEL must be set in your .env file`))
    process.exit(1)
}
main().catch(e => {
    console.error(e)
    process.exit(1)
})
async function main() {



    // Open a browser and log in. Change to headless: false while editing
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto('https://discord.com/app')
    await page.waitForSelector('input[name=email]')
    await page.type('input[name=email]', process.env.DISCORD_USERNAME)
    await page.type('input[name=password]', process.env.DISCORD_PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForNavigation()
    await page.goto(process.env.DISCORD_CHANNEL, {waitUntil: 'networkidle0'})
    await page.waitForSelector('div[aria-label~="Message"][role=textbox]')





    // Given a new chat, what do you want this server to do?
    await page.exposeFunction('newMessageAdded', async (chat) => {
        if (IGNORE_USERNAMES.includes(chat.username)) return
        if (chat.message.indexOf('/') === 0) return
        if (chat.message === '') return

        // Would be safer to have a pseudo slash command, like "only respond to comments that start with cmd:"
        // if (chat.message.indexOf('cmd:') !== 0) return

        console.log(chat)
        await page.focus('div[aria-label~="Message"][role=textbox]')
        // await page.keyboard.type(`${chat.username} said ${chat.message}`)
        await page.keyboard.type('/giphy')
        await page.keyboard.press('Tab')
        await page.keyboard.type('nice')
        // "waitForSelector" of an element you expect to exist is safer, but for a PoC, giphy seems to load within 300ms
        await sleep(300) 
        await page.keyboard.press('Tab')
        await page.keyboard.press('Enter')
    })




    // Inside of the Discord window, listen for new chats and notify this server
    await sleep(1000)
    await page.evaluate(() => {
        let observer = new MutationObserver(function(mutations_list) {
            mutations_list.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(added_node) {
                    if (added_node.querySelector('div').ariaRoleDescription !== 'Message') return
                    const isSending = Array.from(added_node.querySelector('div[id^=message-content]').classList).filter(str => str.indexOf('isSending') === 0).length > 0
                    if (isSending) return
                    const username_id = added_node.querySelector('div').getAttribute('aria-labelledby').split(' ').filter(str => str.indexOf('message-username-') === 0).pop()
                    if (!username_id) return
                    const username = document.querySelector(`#${username_id}`).textContent
                    const message = added_node.querySelector('div[id^="message-content"]').textContent
                    window.newMessageAdded({ username, message })
                });
            });
        });
        observer.observe(document.querySelector("[data-list-id=chat-messages]"), { subtree: false, childList: true })
    })
    console.log(chalk.green(`Discord loaded! Listening for new messages...`))
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}