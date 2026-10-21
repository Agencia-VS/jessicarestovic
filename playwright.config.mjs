import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests',testMatch:'funcional.spec.mjs',workers:1,timeout:90000,
 expect:{timeout:20000},reporter:'list',use:{trace:'retain-on-failure',headless:true,
 launchOptions:process.env.TEST_CHROMIUM_PATH?{executablePath:process.env.TEST_CHROMIUM_PATH,args:['--no-sandbox']}:{}},
});
