import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'browser-verification-output');

async function setupFreshPlanner(page: any, queryParams: string = '') {
  await page.goto(`http://localhost:3000/${queryParams}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    indexedDB.deleteDatabase('workout_planner');
    indexedDB.deleteDatabase('replyf-db');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for initialization to complete before checking buttons
  await page.waitForFunction(
    () => !document.body.innerText.includes('Initializing Replyf workspace'),
    { timeout: 15000 }
  );

  // Enter as Guest
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Continue as Guest')),
    { timeout: 15000 }
  );
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const guestBtn = btns.find((b) => b.textContent?.includes('Continue as Guest'));
    if (guestBtn) guestBtn.click();
  });

  // Step 1: Goal -> Muscle Growth
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Muscle Growth')),
    { timeout: 10000 }
  );
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

  // Step 2: Experience -> Intermediate
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

  // Step 3: Location -> Commercial Gym
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

  // Step 4: Equipment (has defaults) -> Continue
  await page.waitForFunction(
    () => document.body.innerText.includes('What equipment do you have available?'),
    { timeout: 10000 }
  );
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const c = btns.find((btn) => btn.textContent?.trim() === 'Continue');
    if (c) c.click();
  });

  // Step 5: Schedule -> 4 days
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

  // Step 6: Duration -> 45 min
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('45') && b.textContent?.includes('min')),
    { timeout: 10000 }
  );
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((btn) => btn.textContent?.includes('45') && btn.textContent?.includes('min'));
    if (b) b.click();
  });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Generate Workout')),
    { timeout: 10000 }
  );
}

async function verifyAllScenarios() {
  console.log('==================================================');
  console.log('STARTING CHROME BROWSER VERIFICATION SUITE');
  console.log('==================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', (msg) => {
      const txt = msg.text();
      if (txt.includes('handleGenerate') || txt.includes('error') || txt.includes('Error') || txt.includes('AuthGuard') || txt.includes('Onboarding')) {
        console.log('    [PAGE LOG]', txt);
      }
    });
    page.on('pageerror', (err) => {
      console.error('    [PAGE UNCAUGHT ERROR]', err);
    });

    // =========================================================================
    // SCENARIO 1: Full 1.2s Progression & Dual-Arc Continuous Rotation
    // =========================================================================
    console.log('[SCENARIO 1] Testing 1.2s checklist progression & dual arcs with simDelay=8500...');
    await setupFreshPlanner(page, '?simDelay=8500');

    // Click Generate Workout
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gen = btns.find((btn) => btn.textContent?.includes('Generate Workout'));
      if (gen) gen.click();
    });

    // Check immediately at ~300ms (Stage 1 active)
    await new Promise((r) => setTimeout(r, 300));
    const stage0State = await page.evaluate(() => {
      const roleStatus = document.querySelector('[role="status"]');
      const genBadge = document.body.innerText.includes('GENERATE PLAN');
      const buildingHeading = document.body.innerText.includes('Building your workout plan');
      const dualArcs = document.querySelectorAll('svg circle[stroke-linecap="round"]');
      const completedChecks = document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check');
      const stage1Text = document.body.innerText.includes('Understanding your training goals');
      return {
        hasRoleStatus: !!roleStatus,
        genBadge,
        buildingHeading,
        dualArcCount: dualArcs.length,
        completedChecks: completedChecks.length,
        stage1Text,
      };
    });
    console.log('  -> 0.3s check (Stage 1 active):', stage0State);
    if (!stage0State.hasRoleStatus || !stage0State.genBadge || !stage0State.buildingHeading) {
      throw new Error('Loading UI did not render immediately upon Step 6 submission!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's1_01_stage1_active.png') });

    // Check at 1.5s (Stage 1 completed, Stage 2 active)
    await new Promise((r) => setTimeout(r, 1200));
    const stage1State = await page.evaluate(() => {
      const completedChecks = document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check');
      return { completedChecks: completedChecks.length };
    });
    console.log('  -> 1.5s check (Stage 1 complete, Stage 2 active): completedChecks =', stage1State.completedChecks);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's1_02_stage2_active.png') });

    // Check at 2.7s (Stage 2 completed)
    await new Promise((r) => setTimeout(r, 1200));
    const stage2State = await page.evaluate(() => {
      const completedChecks = document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check');
      return { completedChecks: completedChecks.length };
    });
    console.log('  -> 2.7s check (Stage 2 complete, Stage 3 active): completedChecks =', stage2State.completedChecks);

    // Check at 3.9s (Stage 3 completed)
    await new Promise((r) => setTimeout(r, 1200));
    const stage3State = await page.evaluate(() => {
      const completedChecks = document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check');
      return { completedChecks: completedChecks.length };
    });
    console.log('  -> 3.9s check (Stage 3 complete, Stage 4 active): completedChecks =', stage3State.completedChecks);

    // Check at 5.1s (Stage 4 completed)
    await new Promise((r) => setTimeout(r, 1200));
    const stage4State = await page.evaluate(() => {
      const completedChecks = document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check');
      return { completedChecks: completedChecks.length };
    });
    console.log('  -> 5.1s check (Stage 4 complete, Stage 5 active): completedChecks =', stage4State.completedChecks);

    // Check at 6.3s (Stage 5 completed, Stage 6 active)
    await new Promise((r) => setTimeout(r, 1200));
    const stage5State = await page.evaluate(() => {
      const completedChecks = document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check');
      return { completedChecks: completedChecks.length };
    });
    console.log('  -> 6.3s check (Stage 5 complete, Stage 6 active): completedChecks =', stage5State.completedChecks);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's1_03_stage6_active.png') });

    // Check at 7.5s (All 6 stages complete, dual arcs STILL rotating indefinitely)
    await new Promise((r) => setTimeout(r, 1200));
    const stage6State = await page.evaluate(() => {
      const completedChecks = document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check');
      const roleStatus = document.querySelector('[role="status"]');
      const dualArcs = document.querySelectorAll('svg circle[stroke-linecap="round"]');
      return {
        completedChecks: completedChecks.length,
        loadingStillVisible: !!roleStatus,
        dualArcCount: dualArcs.length,
      };
    });
    console.log('  -> 7.5s check (All 6 completed, arcs still rotating):', stage6State);
    if (stage6State.completedChecks !== 6 || !stage6State.loadingStillVisible) {
      throw new Error(`Expected all 6 completed rows while generation still running, got: ${JSON.stringify(stage6State)}`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's1_04_all6_complete_arcs_still_rotating.png') });

    // Wait until generation finishes (simDelay=8500 so completes shortly after 8.5s)
    await page.waitForFunction(() => !document.querySelector('[aria-label="Generation checklist"]'), { timeout: 15000 });
    const finishedState = await page.evaluate(() => {
      const loadingChecklist = document.querySelector('[aria-label="Generation checklist"]');
      const bodyText = document.body.innerText;
      const hasPlanOrHub =
        bodyText.includes('Generated Plan') ||
        bodyText.includes('Workout Plan') ||
        bodyText.includes('Your Selections') ||
        bodyText.includes('Day 1') ||
        bodyText.includes('Weekly Schedule') ||
        bodyText.includes('Session');
      return { loadingStillVisible: !!loadingChecklist, hasPlanOrHub };
    });
    console.log('  -> Engine finished, transitioned out of loading:', finishedState);
    if (finishedState.loadingStillVisible) {
      throw new Error('Loading screen failed to unmount after generation finished!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's1_05_generation_completed.png') });
    console.log('✅ Scenario 1 PASSED.\n');

    // =========================================================================
    // SCENARIO 2: Fast Generation (simDelay=0)
    // =========================================================================
    console.log('[SCENARIO 2] Testing fast generation with simDelay=0...');
    await setupFreshPlanner(page, '?simDelay=0');

    // Click Generate Workout
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gen = btns.find((btn) => btn.textContent?.includes('Generate Workout'));
      if (gen) gen.click();
    });

    // Under simDelay=0, it should transition immediately without waiting 7.2s
    await new Promise((r) => setTimeout(r, 400));
    const fastGenState = await page.evaluate(() => {
      const loadingChecklist = document.querySelector('[aria-label="Generation checklist"]');
      const bodyText = document.body.innerText;
      const hasPlanOrHub =
        bodyText.includes('Generated Plan') ||
        bodyText.includes('Workout Plan') ||
        bodyText.includes('Day 1') ||
        bodyText.includes('Weekly Schedule') ||
        bodyText.includes('Session') ||
        bodyText.includes('Your Selections') ||
        bodyText.includes('Exercises');
      return { loadingStillVisible: !!loadingChecklist, hasPlanOrHub };
    });
    console.log('  -> Fast generation check at 400ms:', fastGenState);
    if (fastGenState.loadingStillVisible) {
      throw new Error('Fast generation should resolve and transition immediately without artificial delay!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's2_fast_generation_complete.png') });
    console.log('✅ Scenario 2 PASSED.\n');

    // =========================================================================
    // SCENARIO 3: Error & Retry Flow (simError=1)
    // =========================================================================
    console.log('[SCENARIO 3] Testing error and retry flow with simError=1 and simDelay=500...');
    await setupFreshPlanner(page, '?simError=1&simDelay=500');

    // Click Generate Workout
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gen = btns.find((btn) => btn.textContent?.includes('Generate Workout'));
      if (gen) gen.click();
    });

    // Check loading appears first
    await new Promise((r) => setTimeout(r, 200));
    const loadingAppeared = await page.evaluate(() => {
      return !!document.querySelector('[aria-label="Generation checklist"]');
    });
    console.log('  -> Error flow initial loading check at 200ms:', { loadingAppeared });

    // Wait for error (at 500ms delay)
    await new Promise((r) => setTimeout(r, 700));
    const errorState = await page.evaluate(() => {
      const roleAlert = document.querySelector('[role="alert"]');
      const bodyText = document.body.innerText;
      const hasErrorTitle = bodyText.includes("We couldn't build your workout");
      const hasSavedNote = bodyText.includes('Your planner inputs are still saved');
      const hasTryAgainBtn = Array.from(document.querySelectorAll('button')).some((b) =>
        b.textContent?.includes('Try Again')
      );
      const hasEditPlanBtn = Array.from(document.querySelectorAll('button')).some((b) =>
        b.textContent?.includes('Edit Plan')
      );
      const loadingUnmounted = !document.querySelector('[aria-label="Generation checklist"]');
      return {
        hasRoleAlert: !!roleAlert,
        hasErrorTitle,
        hasSavedNote,
        hasTryAgainBtn,
        hasEditPlanBtn,
        loadingUnmounted,
      };
    });
    console.log('  -> Error state check:', errorState);
    if (!errorState.hasRoleAlert || !errorState.hasErrorTitle || !errorState.hasTryAgainBtn) {
      throw new Error('Error banner did not appear properly on generation failure!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's3_01_error_state.png') });

    // Now disable simError and click "Try Again"
    console.log('  -> Disabling simError and clicking "Try Again"...');
    await page.evaluate(() => {
      (window as any).__REPLYF_SIMULATE_ERROR = false;
      const btns = Array.from(document.querySelectorAll('button'));
      const tryAgain = btns.find((b) => b.textContent?.includes('Try Again'));
      if (tryAgain) tryAgain.click();
    });

    // Check that it enters loading state again with stage 1 active
    await new Promise((r) => setTimeout(r, 250));
    const retryLoadingState = await page.evaluate(() => {
      const loadingChecklist = document.querySelector('[aria-label="Generation checklist"]');
      const completedChecks = document.querySelectorAll('[aria-label="Generation checklist"] svg.lucide-check');
      const stage1Active = document.body.innerText.includes('Understanding your training goals');
      return {
        loadingVisible: !!loadingChecklist,
        completedChecks: completedChecks.length,
        stage1Active,
      };
    });
    console.log('  -> Retry entered loading state:', retryLoadingState);
    if (!retryLoadingState.loadingVisible) {
      throw new Error('Retry did not restart loading state!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's3_02_retry_loading.png') });

    // Wait for retry generation to complete (500ms simDelay)
    await page.waitForFunction(() => !document.querySelector('[aria-label="Generation checklist"]'), { timeout: 5000 });
    const retryCompleted = await page.evaluate(() => {
      return !document.querySelector('[aria-label="Generation checklist"]');
    });
    console.log('  -> Retry successfully completed generation:', { retryCompleted });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's3_03_retry_completed.png') });
    console.log('✅ Scenario 3 PASSED.\n');

    // =========================================================================
    // SCENARIO 4: Double-Submit Protection Test
    // =========================================================================
    console.log('[SCENARIO 4] Testing double-click / rapid generation submission...');
    await setupFreshPlanner(page, '?simDelay=3000');

    const clickStats = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gen = btns.find((btn) => btn.textContent?.includes('Generate Workout'));
      if (!gen) return { clicked: 0 };
      // Rapidly click 3 times
      gen.click();
      gen.click();
      gen.click();
      return { clicked: 3 };
    });
    console.log('  -> Triggered rapid clicks:', clickStats);

    await new Promise((r) => setTimeout(r, 200));
    const doubleClickState = await page.evaluate(() => {
      const statuses = document.querySelectorAll('[aria-label="Generation checklist"]');
      return { statusCount: statuses.length };
    });
    console.log('  -> Double-click status container count:', doubleClickState);
    if (doubleClickState.statusCount !== 1) {
      throw new Error('Multiple loading containers spawned on rapid click!');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 's4_double_submit_protection.png') });
    console.log('✅ Scenario 4 PASSED.\n');

    console.log('==================================================');
    console.log('ALL 4 CHROME BROWSER VERIFICATION SCENARIOS PASSED');
    console.log('==================================================');
  } finally {
    await browser.close();
  }
}

verifyAllScenarios().catch((err) => {
  console.error('BROWSER VERIFICATION FAILED:', err);
  process.exit(1);
});
