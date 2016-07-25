import React from 'react';
import {Route} from 'react-router';
import App from './components/App';
import Home from './components/Home';
import Login from './components/Login';
import LoginSuccess from './components/LoginSuccess';
import Register from './components/Register';

export default (
  <Route component={App}>
    <Route path='/' component={Home} />
    <Route path='/login' component={Login} />
    <Route path='/login/success' component={LoginSuccess} />
    <Route path='/register' component={Register} />
  </Route>
);
