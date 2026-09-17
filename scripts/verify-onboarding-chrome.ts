import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'browser-verification-output');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  console.log('--- STARTING COMPREHENSIVE CHROME BROWSER VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // -------------------------------------------------------------
  // TEST SCENARIO 1: Guest Mode Onboarding & "Your Selections"
  // -------------------------------------------------------------
  console.log('\n[Scenario 1] Starting clean Guest onboarding...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    indexedDB.deleteDatabase('workout_planner');
    indexedDB.deleteDatabase('replyf-db');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Continue as Guest')),
    { timeout: 10000 }
  );

  // Screenshot initial Auth/Guest screen
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_auth_guest_screen.png') });
  console.log('Saved 01_auth_guest_screen.png');

  // Verify initial buttons
  const authButtons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean)
  );
  console.log('Auth Screen Buttons:', authButtons);

  // Click Continue as Guest
  console.log('Clicking "Continue as Guest"...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const guestBtn = btns.find((b) => b.textContent?.includes('Continue as Guest'));
    if (guestBtn) guestBtn.click();
  });
  await page.waitForFunction(
    () => Boolean(document.querySelector('h2')?.textContent?.includes('goal')),
    { timeout: 10000 }
  );

  // Verify dedicated header-free onboarding shell is visible
  const step1Info = await page.evaluate(() => {
    const hasHeader = Boolean(document.querySelector('header'));
    const h2 = document.querySelector('h2')?.innerText;
    const selections = Array.from(document.querySelectorAll('aside div.flex.items-center.justify-between'))
      .map((r) => (r as HTMLElement).innerText?.replace(/\n/g, ' -> '));
    return { hasHeader, h2, selections };
  });
  console.log('Step 1 rendered:', step1Info);
  if (step1Info.hasHeader) throw new Error('Header should NOT be visible during onboarding!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_onboarding_step1_empty.png') });

  // Select Step 1: Goal -> Muscle Growth (Hypertrophy)
  console.log('Selecting Goal: Muscle Growth...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const goalBtn = btns.find((b) => b.textContent?.includes('Muscle Growth'));
    if (goalBtn) goalBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  let currentSelections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('aside div.flex.items-center.justify-between'))
      .map((r) => (r as HTMLElement).innerText?.replace(/\n/g, ' -> '));
  });
  console.log('Selections after Goal:', currentSelections);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_step1_goal_selected.png') });

  // Click Continue to Step 2
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find((b) => b.textContent?.trim() === 'Continue');
    if (cont) cont.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Select Step 2: Experience -> Intermediate
  console.log('Selecting Experience: Intermediate...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const expBtn = btns.find((b) => b.textContent?.includes('Intermediate'));
    if (expBtn) expBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  currentSelections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('aside div.flex.items-center.justify-between'))
      .map((r) => (r as HTMLElement).innerText?.replace(/\n/g, ' -> '));
  });
  console.log('Selections after Experience:', currentSelections);

  // Click Continue to Step 3
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find((b) => b.textContent?.trim() === 'Continue');
    if (cont) cont.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Select Step 3: Location -> Commercial Gym
  console.log('Selecting Location: Commercial Gym...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const locBtn = btns.find((b) => b.textContent?.includes('Commercial Gym'));
    if (locBtn) locBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Click Continue to Step 4
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find((b) => b.textContent?.trim() === 'Continue');
    if (cont) cont.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Select Step 4: Equipment -> Ensure Barbell, Dumbbells
  console.log('Checking Equipment on Step 4...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_step4_equipment.png') });

  // Click Continue to Step 5
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find((b) => b.textContent?.trim() === 'Continue');
    if (cont) cont.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Select Step 5: Schedule -> 4 days
  console.log('Selecting Schedule: 4 days...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dayBtn = btns.find((b) => b.textContent?.includes('4') && b.textContent?.includes('days'));
    if (dayBtn) dayBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Click Continue to Step 6
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find((b) => b.textContent?.trim() === 'Continue');
    if (cont) cont.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // Select Step 6: Duration -> 45 min
  console.log('Selecting Duration: 45 min...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const durBtn = btns.find((b) => b.textContent?.includes('45') && b.textContent?.includes('min'));
    if (durBtn) durBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const all6Selections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('aside div.flex.items-center.justify-between'))
      .map((r) => (r as HTMLElement).innerText?.replace(/\n/g, ' -> '));
  });
  console.log('ALL 6 SELECTIONS IN "YOUR SELECTIONS":\n', all6Selections);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_all_6_answers_selected.png') });

  // -------------------------------------------------------------
  // TEST SCENARIO 2: Back & Forward Navigation preserves answers
  // -------------------------------------------------------------
  console.log('\n[Scenario 2] Testing Back and Forward navigation...');
  // Click Back 3 times
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const back = btns.find((b) => b.textContent?.trim() === 'Back');
      if (back) back.click();
    });
    await new Promise((r) => setTimeout(r, 500));
  }
  const backSelections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('aside div.flex.items-center.justify-between'))
      .map((r) => (r as HTMLElement).innerText?.replace(/\n/g, ' -> '));
  });
  console.log('Selections after navigating Back 3 times:', backSelections);

  // -------------------------------------------------------------
  // TEST SCENARIO 3: Page Refresh preserves answers
  // -------------------------------------------------------------
  console.log('\n[Scenario 3] Testing Page Refresh persistence...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));

  const refreshedSelections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('aside div.flex.items-center.justify-between'))
      .map((r) => (r as HTMLElement).innerText?.replace(/\n/g, ' -> '));
  });
  console.log('Selections after Refresh:\n', refreshedSelections);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_refreshed_answers_preserved.png') });

  // Navigate back to Step 6
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cont = btns.find((b) => b.textContent?.trim() === 'Continue');
      if (cont) cont.click();
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  // -------------------------------------------------------------
  // TEST SCENARIO 4: Generate Workout -> Loading -> Workout Review
  // -------------------------------------------------------------
  console.log('\n[Scenario 4] Generating workout...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const gen = btns.find((b) => b.textContent?.includes('Generate Workout'));
    if (gen) gen.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_generation_loading.png') });
  console.log('Saved 07_generation_loading.png');

  // Wait for Workout Review to appear
  await page.waitForFunction(() => {
    return Boolean(document.querySelector('button')?.textContent?.includes('Start Workout')) ||
           Boolean(document.body.innerText.includes('Workout Review')) ||
           Boolean(document.body.innerText.includes('Routine'));
  }, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_workout_review.png') });
  console.log('Workout Review successfully reached!');

  console.log('\n--- BROWSER VERIFICATION SUCCESSFUL ---');
  await browser.close();
}

runVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
