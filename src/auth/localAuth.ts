import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { pool } from "../config/psql";
import { logger } from "../config/logger";
import passport from "passport";
import { UserDTO } from "../types/User";

const parseToUserDTO = (params: Record<any, any>): UserDTO => {
  const parsed = {
    userId: params.user_id,
    email: params.email,
    userName: params.user_name,
    avatarUrl: params.avatar_url,
    displayName: params.display_name,
    role: params.role,
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
  },
  async (email: any, password: any, done: any) => {
    try {
      const { rows } = await pool.query(
        `
        SELECT * FROM user_data WHERE email = $1;
        `,
        [email]
      );

      if (rows.length === 0) {
        return done(null, false, { message: "Incorrect email." });
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return done(null, false, { message: "Incorrect password." });
      } else if (rows.length > 0) {
        logger.info(rows[0])
        const parsedUser = parseToUserDTO(rows[0]);
        done(null, parsedUser);
      }
    } catch (error) {
      done(error);
    }
  }
);

const serializeMiddleware = (user: Partial<UserDTO>, done: any) => {
  done(null, user.userId);
};

const deserializeMiddleware = async (userId: string, done: any) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM user_data 
      WHERE user_id = $1;
      `,
      [userId]
    );
    logger.info(rows[1])
    const parsedUserData = parseToUserDTO(rows[0]);
    logger.info(parsedUserData);
    done(null, parsedUserData);
  } catch (err) {
    logger.log({ level: "error", message: `${err}` });
    done(err, null);
  }
};

passport.use(localStrategyMiddleware);
passport.serializeUser(serializeMiddleware);
passport.deserializeUser(deserializeMiddleware);
