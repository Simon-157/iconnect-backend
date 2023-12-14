import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { pool } from "../config/psql";
import { UserDTO } from "../types/User";
import { logger } from "../config/logger";

const parseToUserDTO = (params: Record<any, any>): UserDTO => {
    const parsed = {
    userId: params.user_id,
    email: params.email,
    userName: params.user_name,
    avatarUrl: params.avatar_url,
    displayName: params.display_name,
    role:params.role,
    bio: params.bio,
    currentRoomId: params.current_room_id,
    lastSeen: params.last_seen,
    createdAt: params.created_at,
  };
  return parsed;
};

const localStrategyMiddleware = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password", 
    passReqToCallback: true,
  },
  async (req: any, email: string, password: string, done: any) => {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM user_data WHERE email = $1`,
        [email]
      );

      if (rows.length === 0) {
        return done(null, false, { message: "Incorrect email or password" });
      }

      const user = rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return done(null, false, { message: "Incorrect email or password" });
      }

      const parsedUser = parseToUserDTO(user);
      return done(null, parsedUser);
    } catch (err) {
      logger.error(err);
      return done(err);
    }
  }
);

passport.use("local", localStrategyMiddleware);

passport.serializeUser((user: Partial<UserDTO>, done) => {
  done(null, user.userId);
});

passport.deserializeUser(async (userId: string, done) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_data WHERE user_id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return done(null, false);
    }

    const parsedUserData = parseToUserDTO(rows[0]);
    return done(null, parsedUserData);
  } catch (err) {
    logger.error(err);
    return done(err);
  }
});

export default passport;




