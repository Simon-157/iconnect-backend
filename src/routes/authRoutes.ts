import  bcrypt from 'bcrypt';
import "dotenv/config";
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import "../auth/googleAuth";
import "../auth/microsoftAuth";
import "../auth/localAuth";
import createHttpError from "http-errors";
import { pool } from "../config/psql";

export const router = Router();


router.get("/google", passport.authenticate("google"));
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect:
      process.env.NODE_ENV == "production"
        ? process.env.CLIENT_URI_CALLBACK_PROD
        : process.env.CLIENT_URI_CALLBACK,
    failureRedirect: "/failure",
  })
);



router.get("/microsoft", passport.authenticate("microsoft"));
router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", {
    successRedirect:
      process.env.NODE_ENV == "production"
        ? process.env.CLIENT_URI_CALLBACK_PROD
        : process.env.CLIENT_URI_CALLBACK,
    failureRedirect: "/failure",
  })
);


router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  try {
    req.logOut(() => req.session.destroy((error) => {
      if(error) {
        throw createHttpError(400, "Bad/Invalid logout request") 
      }
    }));

    res.status(200).json({
      isAuth: req.isAuthenticated(),
      message: req.isAuthenticated()
        ? "Currently authenicated"
        : " Currently unauthenticated",
    });
  } catch (error) {
    next(error);
  }
});





router.post(
  "/local/login",
  
  passport.authenticate("local", {
    successRedirect:
      process.env.NODE_ENV == "production"
        ? process.env.CLIENT_URI_CALLBACK_PROD
        : process.env.CLIENT_URI_CALLBACK,
    failureRedirect: "/failure",
    failureFlash: true,
  })
);

router.post("/local/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const query = {
      text: 'SELECT * FROM user_data WHERE email = $1',
      values: [email],
    };

    const result = await pool.query(query);

    if (result.rows.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = {
      text: 'INSERT INTO user_data (email, password) VALUES ($1, $2) RETURNING *',
      values: [email, hashedPassword],
    };

    const newUser = await pool.query(insertQuery);
    const url = process.env.NODE_ENV == "production"
        ? process.env.CLIENT_URI_CALLBACK_PROD
        : process.env.CLIENT_URI_CALLBACK;

    res.redirect(url!);

  } catch (error) {
    next(error);
  }
});
