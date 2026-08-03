import { expect, test } from '@playwright/test'

test('initial setup authenticates the administrator and protects private routes', async ({ browser, page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/setup')
  await expect(page.getByRole('heading', { name: /Bienvenue dans ShareMyTrips/ })).toBeVisible()

  await page.getByLabel('Nom').fill('Benjamin')
  await page.getByLabel('Email').fill('admin@example.com')
  await page.getByLabel('Mot de passe', { exact: true }).fill('MonMotDePasse123!')
  await page.getByLabel('Confirmation du mot de passe').fill('MonMotDePasse123!')
  await page.getByRole('button', { name: 'Créer le compte' }).click()

  await expect(page).toHaveURL('/')
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('smt_token'))).not.toBeNull()
  await expect(page.getByRole('button', { name: /Benjamin/ })).toBeVisible()
  await expect(page.getByText('Tous les voyages')).toBeVisible()

  const anonymousPage = await browser.newPage()
  await anonymousPage.goto('/setup')
  await expect(anonymousPage).toHaveURL('/login')
  await anonymousPage.close()

  await page.evaluate(() => sessionStorage.clear())
  await page.goto('/account')

  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
})
