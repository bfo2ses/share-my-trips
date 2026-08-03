import { defineConfig, devices } from '@playwright/test'

const backendEnv = {
  ...process.env,
  CORS_ORIGIN: 'http://localhost:5173',
  DATABASE_URL: '',
  ENV: '',
  MEDIA_PATH: '/tmp/sharemytrips-e2e-media',
  PORT: '8080',
}

const frontendEnv = {
  ...process.env,
  VITE_API_URL: 'http://localhost:8080/query',
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'go build -o /tmp/sharemytrips-e2e-server ./cmd/server && exec /tmp/sharemytrips-e2e-server',
      cwd: '../backend',
      env: backendEnv,
      port: 8080,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 500 },
    },
    {
      command: 'npm run dev -- --host localhost --port 5173 --strictPort',
      env: frontendEnv,
      url: 'http://localhost:5173',
      gracefulShutdown: { signal: 'SIGTERM', timeout: 500 },
    },
  ],
})
