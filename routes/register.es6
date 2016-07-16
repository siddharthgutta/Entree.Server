import {Router} from 'express';
import * as User from '../api/controllers/user.es6';

const route = new Router();

route.get('/', (req, res) => res.render('register'));
route.post('/register', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;

  const user = await User.create(username, password, {email});
  console.log(user);
  res.redirect('/login');
});

export default route;
