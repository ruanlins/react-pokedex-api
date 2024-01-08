import { RequestHandler } from 'express';
import createHttpError from 'http-errors';
import UserModel from '../models/user';
import bcrypt from 'bcrypt';

interface SignUpBody {
  username?: string;
  password?: string;
  email?: string;
}

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  const authenticatedUserId = req.session.userId;
  try {
    if (!authenticatedUserId) {
      throw createHttpError(401, 'User not authenticated');
    }

    const user = await UserModel.findById(authenticatedUserId).select('+email').exec();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const signUp: RequestHandler<unknown, unknown, SignUpBody, unknown> = async (req, res, next) => {
  const username = req.body.username;
  const email = req.body.email;
  const passwordRaw = req.body.password;

  try {
    if (!username || !email || !passwordRaw) {
      throw createHttpError(400, 'Parameters missing.');
    }

    const existingUser = await UserModel.findOne({ username: username }).exec();

    if (existingUser) {
      throw createHttpError(409, 'Username already taken. Please choose a diferente one or log in instead.');
    }

    const existingEmail = await UserModel.findOne({ email: email }).exec();

    if (existingEmail) {
      throw createHttpError(409, 'Email already taken. Please choose a diferente one or log in instead.');
    }

    const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const newUser = await UserModel.create({
      username: username,
      email: email,
      password: passwordHashed,
    });

    req.session.userId = newUser._id;

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

interface LoginBody {
  username?: string;
  password?: string;
}

export const login: RequestHandler<unknown, unknown, LoginBody, unknown> = async (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    if (!username || !password) {
      throw createHttpError(400, 'Parameters missing.');
    }

    const user = await UserModel.findOne({ username: username }).select('+email +password').exec();

    if (!user) {
      throw createHttpError(401, 'User not found.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw createHttpError(401, 'Incorrect password.');
    }

    req.session.userId = user._id;

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(200);
    }
  });
};

interface addRemoveBody {
  pokeName: string;
}

export const addPokemon: RequestHandler<unknown, unknown, addRemoveBody, unknown> = async (req, res, next) => {
  console.log(req.body);
  const pokeName = req.body.pokeName;
  try {
    if (pokeName === null || pokeName === undefined) {
      throw createHttpError(400, 'Pokemon name cannot be null or undefined');
    }

    await UserModel.findByIdAndUpdate(
      { _id: req.session.userId },
      {
        $addToSet: {
          favorites: [pokeName],
        },
      },
    ).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const removePokemon: RequestHandler<unknown, unknown, addRemoveBody, unknown> = async (req, res, next) => {
  const pokeName = req.body.pokeName;
  console.log(pokeName);
  try {
    await UserModel.findByIdAndUpdate(
      { _id: req.session.userId },
      {
        $pull: {
          favorites: pokeName,
        },
      },
    ).exec();
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const getAllFavorites: RequestHandler = async (req, res, next) => {
  try {
    const data = await UserModel.findById(req.session.userId, 'favorites').exec();
    if (!data) {
      throw createHttpError(401, 'There is no user logged in.');
    }
    res.status(200).json(data?.favorites);
  } catch (error) {
    next(error);
  }
};
