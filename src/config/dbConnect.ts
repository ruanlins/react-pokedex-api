import mongoose from 'mongoose';
import env from '../utils/validateEnv';

export const dbConnect = async () => {
  try {
    await mongoose.connect(env.MONGO_CONNECTION_STRING);
  } catch (error) {
    console.error(error);
  }
};
