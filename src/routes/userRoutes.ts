import { Router } from 'express';
import { rolesControl } from '../middlewares/authMid';
import UserController from '../controllers/UsersController';

const userRouter = Router();

userRouter.get('/', UserController.get);
userRouter.get('/search', rolesControl.adminControl, UserController.search);
userRouter.get('/:id', rolesControl.adminControl, UserController.get);

userRouter.post('/', rolesControl.adminControl, UserController.createUser);

userRouter.patch('/', UserController.update);
userRouter.patch('/all', rolesControl.adminControl, UserController.updateAllUsers);
userRouter.patch('/:id', rolesControl.adminControl, UserController.update);

export default userRouter;