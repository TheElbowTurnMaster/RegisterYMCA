'use strict';

require('dotenv').config();
const chromium = require('chrome-aws-lambda');
const { threeDaysFromToday, toWrittenDay } = require('date-utils');

module.exports.bookFreeWeights = async (dateAndTimes) => {
  let result = null;
  let browser = null;

  try {
    const workoutDate = threeDaysFromToday()
    const workoutTime = dateAndTimes[toWrittenDay(workoutDate.getDay())]
    if(!workoutTime) {
      return {
        message: "Not a workout day"
      }
    }

    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(process.env.YMCA_URL);

    await clickXPath(page, "//span[contains(text(),'Free Weights')]");

    const dateDay = workoutDate.getDate();
    const dateXPath = '//div[text()="' + dateDay + '"]';
    if(dateDay <= 3) {
        await page.waitForSelector('[class="image icon-chevronRight"]');
        await page.click('[class="image icon-chevronRight"]');
    }
    await clickXPath(page, dateXPath);

    await page.waitForXPath('//div[@class="focusable timePicker"]/ul/li');
    const availableTimeElements = await page.$x('//div[@class="focusable timePicker"]/ul/li');
    const timeIndex = await page.evaluate((workoutTime, ...availableTimeElements) => {
        return availableTimeElements
          .map(e => e.innerText)
          .findIndex(time => time == workoutTime);
    }, workoutTime, ...availableTimeElements);

    if(timeIndex != -1) {
        await availableTimeElements[timeIndex].click();
    }

    await page.focus('[placeholder = Name]');
    await page.waitForTimeout(100);
    await page.type('[placeholder = Name]', process.env.NAME);
    await page.type('[placeholder = Email]', process.env.EMAIL);
    await page.type('[placeholder="Phone number"]', process.env.PHONE);
    await page.select('#af1aa7f3-a272-4226-8ac9-815f58267c52', "Yes");

    await page.click('[type = submit]');

    const bookingSuccessful = await page
      .waitForXPath('//div/h3[text()="Thank you for booking with us!"]', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    result = {
      bookingSuccessful: bookingSuccessful,
      dayOfWeek: workoutDate,
      time: workoutTime
    }

    // await clickXPath(page, '//button[text()="OK"]');
    // await clickXPath(page, '//button[text()="Cancel booking"]');
    // await clickXPath(page, '//div[@class="buttons"]/button[text()="Cancel booking"]');

  } catch (error) {
    return { error: error };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return {
    ...result
  };
}

async function clickXPath(page, xpath) {
  await page.waitForXPath(xpath);
  const [button] = await page.$x(xpath);
  if(button) {
    await button.click();
  }
}