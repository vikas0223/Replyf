import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testPage() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,800'],
  });
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR STACK:', err.stack || err.message));
    console.log('Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    console.log('Waiting for initialization to complete...');
    await page.waitForFunction(
      () => !document.body.innerText.includes('Initializing Replyf workspace'),
      { timeout: 10000 }
    );
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log('--- PAGE TEXT AFTER INIT ---');
    console.log(text.slice(0, 500));
    console.log('----------------------------');
    await page.screenshot({ path: path.resolve(process.cwd(), 'browser-verification-output', 'debug_page.png') });
  } finally {
    await browser.close();
  }
}

testPage().catch(console.error);
