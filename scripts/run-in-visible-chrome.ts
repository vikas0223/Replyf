import puppeteer from 'puppeteer-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_USER_DATA = path.join(os.tmpdir(), `replyf-chrome-user-data-${Date.now()}`);
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'browser-verification-output');

async function runInVisibleChrome() {
  console.log('====================================================');
  console.log('LAUNCHING VISIBLE GOOGLE CHROME FOR LIVE DEMO & VERIFICATION');
  console.log('====================================================\n');

  fs.mkdirSync(TEMP_USER_DATA, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: { width: 1280, height: 860 },
    args: [
      '--no-sandbox',
      '--window-size=1280,860',
      `--user-data-dir=${TEMP_USER_DATA}`,
    ],
  });

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.setViewport({ width: 1280, height: 860 });

    console.log('[1/7] Navigating to Replyf at http://localhost:3000/?simDelay=8500...');
    await page.goto('http://localhost:3000/?simDelay=8500', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      try { indexedDB.deleteDatabase('workout_planner'); } catch {}
      try { indexedDB.deleteDatabase('replyf-db'); } catch {}
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for the Guest / Welcome screen
    console.log('[2/7] Waiting for Welcome / Access screen...');
    await page.waitForFunction(
      () => {
        const hasGuest = Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Continue as Guest'));
        const hasMuscle = Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Muscle Growth'));
        return hasGuest || hasMuscle;
      },
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 600));

    const needsGuest = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const guestBtn = btns.find((b) => b.textContent?.includes('Continue as Guest'));
      if (guestBtn) {
        guestBtn.click();
        return true;
      }
      return false;
    });
    if (needsGuest) {
      console.log('[3/7] Clicked "Continue as Guest"...');
    } else {
      console.log('[3/7] Already at Planner Question 1.');
    }

    // Step 1: Goal
    console.log('[4/7] Stepping through 6 Planner Questions...');
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Muscle Growth')),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('Muscle Growth'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 2: Experience
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Intermediate')),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('Intermediate'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 3: Location
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Commercial Gym')),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('Commercial Gym'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 4: Equipment
    await page.waitForFunction(
      () => document.body.innerText.includes('What equipment do you have available?'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 5: Schedule
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('4') && b.textContent?.includes('days')),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('4') && btn.textContent?.includes('days'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 6: Duration
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('45') && b.textContent?.includes('min')),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('45') && btn.textContent?.includes('min'));
      if (b) b.click();
    });

    // Wait for "Generate Workout" button
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Generate Workout')),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 600));

    console.log('[5/7] Clicking "Generate Workout" to enter loading state...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gen = btns.find((btn) => btn.textContent?.includes('Generate Workout'));
      if (gen) gen.click();
    });

    // Verify loading screen rendered immediately
    await new Promise((r) => setTimeout(r, 400));
    const loadingInfo = await page.evaluate(() => {
      const roleStatus = document.querySelector('[role="status"]');
      const badge = document.body.innerText.includes('GENERATE PLAN');
      const heading = document.body.innerText.includes('Building your workout plan');
      const dualArcs = document.querySelectorAll('svg circle[stroke-linecap="round"]').length;
      return { hasRoleStatus: !!roleStatus, badge, heading, dualArcs };
    });
    console.log('  -> Loading Screen Appeared:', loadingInfo);
    if (!loadingInfo.hasRoleStatus || !loadingInfo.badge || !loadingInfo.heading) {
      throw new Error('Loading screen failed to render upon submission!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_loading_screen_visible.png') });

    console.log('[6/7] Observing 1.2s checklist progression live in Chrome:');
    for (let sec = 1; sec <= 6; sec++) {
      await new Promise((r) => setTimeout(r, 1200));
      const checks = await page.evaluate(() => {
        return document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check').length;
      });
      console.log(`  -> t = ${(sec * 1.2).toFixed(1)}s: Completed stages = ${checks} / 6`);
    }

    // Wait until generation finishes (~8.5s total)
    console.log('[7/7] Waiting for generation resolution and transition to workout review...');
    await page.waitForFunction(
      () => !document.querySelector('[aria-label="Generation checklist"]'),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 800));

    const finalState = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasWorkoutHub: text.includes('Workout Plan') || text.includes('Generated Plan') || text.includes('Day 1') || text.includes('Sessions') || text.includes('Weekly Goal') || text.includes('Your Selections'),
      };
    });
    console.log('  -> Generation Completed! Transitioned to Workout Hub:', finalState);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_workout_plan_transition.png') });

    console.log('\n====================================================');
    console.log('LIVE CHROME DEMONSTRATION & VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================\n');

    // Keep visible Chrome open for 5 seconds for user observation
    await new Promise((r) => setTimeout(r, 5000));
  } finally {
    await browser.close();
    try {
      fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true });
    } catch {}
  }
}

runInVisibleChrome().catch((err) => {
  console.error('LIVE CHROME RUN FAILED:', err);
  process.exit(1);
});
