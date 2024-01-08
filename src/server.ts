import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { dbConnect } from './config/dbConnect';
import mongoose from 'mongoose';
import env from './utils/validateEnv';
import morgan from 'morgan';
import createHttpError, { isHttpError } from 'http-errors';
import userRoutes from './routes/users';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';

const app = express();
const port = env.PORT;

//Conect MongoDB
dbConnect();

//Request logger
app.use(morgan('dev'));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
    rolling: true,
    store: MongoStore.create({
      mongoUrl: env.MONGO_CONNECTION_STRING,
    }),
  }),
);

app.use('/user', userRoutes);

app.use((req, res, next) => {
  next(createHttpError(404, 'Endpoint not found'));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  let errorMessage = 'An unknown error occurred';
  let statusCode = 500;
  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }
  res.status(statusCode).json({ error: errorMessage });
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
