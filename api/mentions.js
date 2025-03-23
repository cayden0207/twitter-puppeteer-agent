import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  const { TWITTER_USER, TWITTER_PASS } = process.env;

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    await page.goto('https://twitter.com/login');
    await page.waitForSelector('input[name="text"]');
    await page.type('input[name="text"]', TWITTER_USER);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.type('input[name="password"]', TWITTER_PASS);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ timeout: 15000 });

    await page.goto('https://twitter.com/notifications/mentions');
    await page.waitForSelector('article', { timeout: 10000 });

    const mentions = await page.$$eval('article', articles => {
      return articles.slice(0, 5).map(article => {
        const username = article.querySelector('div[dir="ltr"] span')?.innerText;
        const content = article.innerText;
        const linkNode = article.querySelector('a[href*="/status/"]');
        const tweetUrl = linkNode ? 'https://twitter.com' + linkNode.getAttribute('href') : null;
        return { username, content, tweetUrl };
      });
    });

    await browser.close();
    res.status(200).json(mentions);
  } catch (error) {
    await browser.close();
    res.status(500).json({ error: error.message });
  }
}
