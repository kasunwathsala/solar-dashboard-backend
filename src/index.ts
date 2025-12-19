// console.log('Hello, World!');
import express from 'express';
import "dotenv/config";
import { connectDB } from './infrastructure/db';
import { startScheduler } from './infrastructure/scheduler';
import solarUnitRouter from './api/solar-unit';
import energyGenerationRecordRouter from './api/energy-generation-record';
const server = express();
import { loggerMiddleware } from './api/middlewares/logger-middleware';
import { globalErrorHandler } from './api/middlewares/global-error-handling-middleware';
import webhooksRouter from './api/webhooks';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import usersRouter from "./api/users";
import weatherRouter from './api/weather';

server.use(cors({origin: true})); // Allow all origins in development

// Middleware

server.use('/api/webhooks', webhooksRouter);
server.use('/api/weather', weatherRouter);
server.use(clerkMiddleware());
server.use(express.json());

server.use(loggerMiddleware);

server.use('/api/solar-units', solarUnitRouter);
server.use('/api/energy-generation-records', energyGenerationRecordRouter);
server.use("/api/users", usersRouter);


connectDB().then(() => {
    // Start background scheduler after DB connection
    // startScheduler(); // TEMPORARILY DISABLED FOR DEBUGGING
});

server.use(globalErrorHandler);

const PORT = 8002;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});