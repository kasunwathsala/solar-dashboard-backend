// console.log('Hello, World!');
import express from 'express';
import "dotenv/config";
import { connectDB } from './infrastructure/db';
import solarUnitRouter from './api/solar-unit';
import energyGenerationRecordRouter from './api/energy-generation-record';
const server = express();
import { loggerMiddleware } from './api/middlewares/logger-middleware';
import { globalErrorHandler } from './api/middlewares/global-error-handling-middleware';

// Middleware
server.use(express.json());

server.use(loggerMiddleware);

server.use('/api/solar-units', solarUnitRouter);
server.use('/api/energy-generation-records', energyGenerationRecordRouter);

connectDB();

server.use(globalErrorHandler);

const PORT = 8002;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});