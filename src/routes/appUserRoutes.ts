import express from 'express';
import * as userController from '../controllers/userController';
import passport from 'passport';
import '../auth/localAuth';


export const appUserRouter = express.Router();


appUserRouter.get('/:userId', async (req, res) => {
  await userController.getUserById(req, res);
});

appUserRouter.get('/admin/all', async (req, res) => {
  await userController.getAllUsers(req, res);
});

appUserRouter.post('/', async (req, res) => {
  await userController.createUser(req, res);
});


appUserRouter.post('/assign-issue-resolver', async (req, res) => {
  await userController.makeUserIssueResolverController(req, res);
});

appUserRouter.patch('/role/:userId', async (req, res) => {
  await userController.changeUserRoleController(req, res);
});


appUserRouter.patch('/:userId/avatar', async (req, res) => {
  await userController.updateUserAvatarController(req, res);
});


appUserRouter.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login-failure",
    failureFlash: true,
  }),
  (req, res) => {
    res.status(200).json({
      success:true,
      message: "Login successful",
      user: req.user, 
    });
  }
);
