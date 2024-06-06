import { Router } from 'express';
import { rolesControl } from '../middlewares/auth.middleware';
import { usersController } from '../controllers';

const userRouter = Router();

userRouter.get('/', usersController.get);
userRouter.get('/search', rolesControl.adminControl, usersController.search);
userRouter.get('/addresses', usersController.getAddress);
userRouter.get('/:id', rolesControl.adminControl, usersController.get);
userRouter.get('/:id/addresses', rolesControl.adminControl, usersController.getAddress);

userRouter.post('/', rolesControl.adminControl, usersController.createUser);

userRouter.patch('/', usersController.update);

// userRouter.patch('/all', rolesControl.adminControl, usersController.updateAllUsers);
userRouter.patch('/:id', rolesControl.adminControl, usersController.update);

export default userRouter;