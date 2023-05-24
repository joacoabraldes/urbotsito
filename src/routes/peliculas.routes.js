import {Router} from 'express';
import { getPeliculas } from '../controllers/peliculas.controller.js';

const router = Router()

router.get('/', getPeliculas)

export default router 