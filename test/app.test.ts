import { describe, expect, it } from 'bun:test'
import { app } from '../src/app'

describe('app', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')

    expect(res.status).toBe(200)

    const body = await res.json()

    expect((body as { status: string }).status).toBe("ok")
  })

  it('GET /missing returns 404', async () => {
    const res = await app.request('/missing')

    expect(res.status).toBe(404)
  })
})