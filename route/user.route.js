import {Router} from 'express'
import { loginusercontroller, logoutController, updateUserDetails, userDetails } from '../controllers/user.controller.js'
import auth from '../middleware/auth.js';

const userRouter = Router()

userRouter.post('/login',loginusercontroller)
userRouter.get("/logout", auth, logoutController);
userRouter.put('/update-user',auth,updateUserDetails)
userRouter.get('/user-details',auth,userDetails)

export default userRouter