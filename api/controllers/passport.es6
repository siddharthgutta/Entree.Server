import passport from 'passport';
import PassportLocal from 'passport-local';
import * as User from './user.es6';
import * as Utils from '../../libs/utils.es6';

const LocalStrategy = PassportLocal.Strategy;

/**
 * Initializes passport by setting up the strategy and serialization/deserialization process
 *
 * @returns {Null}: returns nothing
 */
export async function init() {
  passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await User.findByUsername(username);
    const pass = await User.comparePassword(password, user.password);
    if (!Utils.isEmpty(user) && pass) done(null, user);
    else done(null, false);
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
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
