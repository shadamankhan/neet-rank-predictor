const request = require('supertest');
const express = require('express');
const predictRouter = require('../src/routes/predict');

const app = express();
app.use(express.json());
app.use('/api/predict', predictRouter);

describe('POST /api/predict', () => {
    it('should return a prediction for valid 2024 data', async () => {
        const response = await request(app)
            .post('/api/predict')
            .send({ year: 2024, score: 650 });
        
        expect(response.statusCode).toBe(200);
        expect(response.body.ok).toBe(true);
        expect(response.body.year).toBe(2024);
        expect(response.body.score).toBe(650);
        expect(response.body.predictedRank).toBeDefined();
    });

    it('should return 400 if year is missing', async () => {
        const response = await request(app)
            .post('/api/predict')
            .send({ score: 650 });
        
        expect(response.statusCode).toBe(400);
        expect(response.body.ok).toBe(false);
    });
});
