import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
    launchOptions: {
      // Software WebGL so the map renders headless; route tile requests through the
      // sandbox proxy when one is configured (Claude cloud sessions). CI has direct access.
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } } : {}),
    },
  },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
