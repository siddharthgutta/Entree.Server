import {Router} from 'express';
import passport from 'passport';
import * as Passport from '../api/controllers/passport.es6';

const route = new Router();

route.get('/', (req, res) => res.render('login'));
route.get('/success', Passport.ensureAuthenticated, (req, res) => res.render('login-success'));
route.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

route.post('/',
	passport.authenticate('local', {successRedirect: '/login/success', failureRedirect: '/login'})
);

Passport.init();

export default route;
