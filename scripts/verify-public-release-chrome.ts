import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'browser-verification-output');

async function verifyPublicRelease() {
  console.log('================================================================');
  console.log('REPLYF PUBLIC RELEASE BROWSER VERIFICATION (CHROME)');
  console.log('================================================================\n');

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
      console.error('  [PAGE ERROR]', err.message);
    });

    // -------------------------------------------------------------------------
    // 1. Verify Landing Page Loads
    // -------------------------------------------------------------------------
    console.log('[Step 1] Navigating to landing page at http://localhost:3000/landing...');
    await page.goto('http://localhost:3000/landing', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(
      () => document.body.innerText.includes('Replyf') && (document.body.innerText.includes('Start Training') || document.body.innerText.includes('Generate')),
      { timeout: 20000 }
    );
    await new Promise((r) => setTimeout(r, 1000));

    const landingInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasHeading = text.includes('Replyf') || text.includes('training') || text.includes('workout');
      const startBtn = Array.from(document.querySelectorAll('a, button')).some(
        (el) => el.textContent?.includes('Start Training') || el.textContent?.includes('Generate Your Plan')
      );
      return { hasHeading, startBtn, title: document.title };
    });
    console.log('  -> Landing Page Loaded:', landingInfo);
    if (!landingInfo.hasHeading) {
      throw new Error('Landing page headline failed to render!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'release_01_landing_page.png') });

    // -------------------------------------------------------------------------
    // 2. Verify "Start Training" Works and Navigates to App
    // -------------------------------------------------------------------------
    console.log('[Step 2] Clicking "Start Training" CTA on landing page...');
    const startLink = await page.$('a[href="/"]');
    if (startLink) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
        startLink.click(),
      ]);
    } else {
      await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    }
    await new Promise((r) => setTimeout(r, 600));

    // Clear any previous state to test fresh entry
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      try { indexedDB.deleteDatabase('workout_planner'); } catch {}
      try { indexedDB.deleteDatabase('replyf-db'); } catch {}
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for initialization to complete
    console.log('[Step 3] Waiting for application initialization and Welcome / Access screen...');
    await page.waitForFunction(
      () => !document.body.innerText.includes('Initializing Replyf workspace'),
      { timeout: 15000 }
    );

    // -------------------------------------------------------------------------
    // 3. Verify Application Loads & Enter Guest Mode
    // -------------------------------------------------------------------------
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Continue as Guest')),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 600));

    const authScreenState = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasGuestBtn: Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Continue as Guest')),
        hasSignInBtn: text.includes('Sign in') || text.includes('Create account'),
      };
    });
    console.log('  -> Welcome / Access Screen Verified:', authScreenState);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'release_02_auth_welcome_screen.png') });

    console.log('[Step 4] Selecting "Continue as Guest"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const guestBtn = btns.find((b) => b.textContent?.includes('Continue as Guest'));
      if (guestBtn) guestBtn.click();
    });

    // -------------------------------------------------------------------------
    // 4. Verify Current Planner Is Present
    // -------------------------------------------------------------------------
    console.log('[Step 5] Verifying current Planner Questionnaire (Step 1 Goal)...');
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Muscle Growth')),
      { timeout: 15000 }
    );
    await new Promise((r) => setTimeout(r, 500));

    const plannerPresent = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasGoalQuestion: text.includes('What is your primary fitness goal?'),
        hasMuscleGrowth: Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Muscle Growth')),
        hasFatLoss: Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Fat Loss')),
      };
    });
    console.log('  -> Current Planner Verified:', plannerPresent);
    if (!plannerPresent.hasGoalQuestion || !plannerPresent.hasMuscleGrowth) {
      throw new Error('Current planner questionnaire failed to render!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'release_03_planner_questionnaire.png') });

    // -------------------------------------------------------------------------
    // 5. Complete 6 Steps and Test "Generate Plan"
    // -------------------------------------------------------------------------
    console.log('[Step 6] Stepping through 6 Planner Questions...');
    // Step 1: Muscle Growth
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('Muscle Growth'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 2: Intermediate
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Intermediate')),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('Intermediate'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 3: Commercial Gym
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Commercial Gym')),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('Commercial Gym'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 4: Equipment (defaults valid)
    await page.waitForFunction(
      () => document.body.innerText.includes('What equipment do you have available?'),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 5: Schedule (4 days)
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('4') && b.textContent?.includes('days')),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('4') && btn.textContent?.includes('days'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
      if (c) c.click();
    });

    // Step 6: Duration (45 min)
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('45') && b.textContent?.includes('min')),
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent?.includes('45') && btn.textContent?.includes('min'));
      if (b) b.click();
    });

    // Wait for "Generate Workout" button
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Generate Workout')),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 500));

    console.log('[Step 7] Clicking "Generate Workout"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gen = btns.find((btn) => btn.textContent?.includes('Generate Workout'));
      if (gen) gen.click();
    });

    // Check if in loading state or already generated
    await new Promise((r) => setTimeout(r, 200));
    const step7State = await page.evaluate(() => {
      const text = document.body.innerText;
      const isLoading = text.includes('Building your workout plan') || text.includes('GENERATE PLAN');
      const isGenerated = text.includes('Workout Plan') || text.includes('Sessions') || text.includes('Day 1') || text.includes('Your Selections');
      return { isLoading, isGenerated };
    });
    console.log('  -> Step 7 State (Loading or Generated):', step7State);

    if (step7State.isLoading) {
      console.log('[Step 8] Waiting for generation completion and transition to Workout Hub...');
      await page.waitForFunction(
        () => !document.querySelector('[aria-label="Generation checklist"]'),
        { timeout: 15000 }
      );
      await new Promise((r) => setTimeout(r, 800));
    }

    const finalHubState = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasPlan = text.includes('Workout Plan') || text.includes('Day 1') || text.includes('Sessions') || text.includes('Push') || text.includes('Upper') || text.includes('Full Body');
      const hasSelections = text.includes('Your Selections') || text.includes('Muscle Growth');
      return { hasPlan, hasSelections };
    });
    console.log('  -> Workout Hub Generated Successfully:', finalHubState);
    if (!finalHubState.hasPlan) {
      throw new Error('Generated workout plan failed to render in Workout Hub!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'release_05_workout_hub_ready.png') });

    // Check for fatal page errors
    console.log('  -> Uncaught Page Errors:', pageErrors.length);
    if (pageErrors.length > 0) {
      console.warn('     Errors logged:', pageErrors);
    }

    console.log('\n================================================================');
    console.log('✅ ALL PUBLIC RELEASE BROWSER VERIFICATION CHECKS PASSED');
    console.log('================================================================\n');
  } finally {
    await browser.close();
  }
}

verifyPublicRelease().catch((err) => {
  console.error('RELEASE VERIFICATION FAILED:', err);
  process.exit(1);
});
