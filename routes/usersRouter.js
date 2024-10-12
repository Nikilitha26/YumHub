import express from 'express'
import {getUsers, getUser, insertUser, deleteUser, updateUser,loginUser} from '../contoller/usersController.js'
import { checkUser } from '../middleware/authenticate.js'

const router = express.Router()

router.post('/login',checkUser, loginUser) //(req,res)=>{
//     res.json({message:"You have signed in!!", token:req.body.token})
// })

router.
    route('/')
        .get(getUsers)
        .post(insertUser)
router.
    route('/:id')
        .get(getUser)
        .delete(deleteUser)
        .patch(updateUser)
        
export default router