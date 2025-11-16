// console.log('Hello, World!');
import express from 'express';
import "dotenv/config";
import { connectDB } from './infrastructure/db';
import solarUnitRouter from './api/solar-unit';
import energyGenerationRecordRouter from './api/energy-generation-record';
const server = express();
import { loggerMiddleware } from './api/middlewares/logger-middleware';
import { globalErrorHandler } from './api/middlewares/global-error-handling-middleware';
import webhooksRouter from './api/webhooks';
import cors from 'cors';

server.use(cors({origin: 'http://localhost:5173'}));

// Middleware
server.use('/api/webhooks', webhooksRouter);
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