import { defineConfig, devices } from '@playwright/test'

// Keep E2E servers isolated from the development servers running on 8080/5173.
// Both ports remain overridable for CI or local debugging.
const backendPort = process.env.E2E_BACKEND_PORT ?? '18080'
const frontendPort = process.env.E2E_FRONTEND_PORT ?? '15173'
const backendURL = `http://localhost:${backendPort}`
const frontendURL = `http://localhost:${frontendPort}`

const backendEnv = {
  ...process.env,
  CORS_ORIGIN: frontendURL,
  DATABASE_URL: '',
  ENV: '',
  MEDIA_PATH: '/tmp/sharemytrips-e2e-media',
  PORT: backendPort,
}

const frontendEnv = {
  ...process.env,
  VITE_API_URL: `${backendURL}/query`,
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: frontendURL,
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
      port: Number(backendPort),
      gracefulShutdown: { signal: 'SIGTERM', timeout: 500 },
    },
    {
      command: `npm run dev -- --host localhost --port ${frontendPort} --strictPort`,
      env: frontendEnv,
      url: frontendURL,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 500 },
    },
  ],
})
