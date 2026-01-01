// test/predict.test.js
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../app'); // adjust path to your app export

describe('POST /api/predict', () => {
  beforeAll(() => {
    // Ensure sample distribution exists
    const sampleSrc = path.join(__dirname, 'fixtures', 'distribution_2024.json');
    const target = path.join(__dirname, '..', 'data', 'distribution_2024.json');
    if (!fs.existsSync(target)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(sampleSrc, target);
    }
  });

  it('returns predicted rank and percentile for a known score', async () => {
    const res = await request(app)
      .post('/api/predict')
      .send({ year: 2024, score: 500 })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty('percentile');
    expect(res.body).toHaveProperty('predicted_rank');
  });
});
