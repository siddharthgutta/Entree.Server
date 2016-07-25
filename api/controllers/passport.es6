import passport from 'passport';
import {Strategy as PassportLocalStrategy} from 'passport-local';
import * as User from './user.es6';

/**
 * Initializes passport by setting up the strategy and serialization/deserialization process
 *
 * @returns {Null}: returns nothing
 */
export async function init() {
  /**
   * Uses local strategy for checking account username/password
   */
  passport.use(new PassportLocalStrategy(async (username, password, done) => {
    // Finds user by username
    let user;
    try {
      user = await User.findByUsername(username);
    } catch (findByUsernameErr) {
      done(null, false, {message: 'Incorrect Username'});
    }

    // Compares passwords, throws error if bcrypt errors
    let passwordMatches;
    try {
      passwordMatches = await User.comparePassword(password, user.password);
    } catch (comparePasswordError) {
      done(comparePasswordError);
    }

    // If passwordMatches is true, then passwords match
    if (passwordMatches) {
      done(null, user);
    } else {
      done(null, false, {message: 'Incorrect Password'});
    }
  }));

  /**
   * Serializes the user for sessions/cookies
   */
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  /**
   * Deserializes the user for sessions/cookies
   */
  passport.deserializeUser(async (id, done) => {
    const user = await User.findOneById(id);
    done(null, user);
  });
}

/**
 * Checks for authentication of the user
 *
 * @param {Object} req: the request
 * @param {Object} res: the response
 * @param {Function} next: the function to be called if authenticated
 * @returns {*}: returns the next function if true, nothing if false
 */
export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log('user not authenticated, redirecting...');
  res.redirect('/login');
}

/**
 * Initializes passport
 */
init();
