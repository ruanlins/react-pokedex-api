import express from 'express';
import * as UserController from '../controllers/users';

const router = express.Router();

router.get('/', UserController.getAuthenticatedUser);
router.post('/signup', UserController.signUp);
router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.post('/favorites/add', UserController.addPokemon);
router.post('/favorites/remove', UserController.removePokemon);
router.get('/favorites', UserController.getAllFavorites);

export default router;
