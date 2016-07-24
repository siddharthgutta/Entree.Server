/**
 * Created by kfu on 7/24/16.
 */

import React from 'react';

var Register = React.createClass({
  render() {
    return (
      <form acceptCharset="utf-8" action="/register/register" id="register" method="post" name="register">
        <h3>Register</h3>
        <ul style={{listStyleType: 'none'}}>
          <li>Username<input name="username" placeholder="yourname" required type="username" /></li>
          <li>Password<input name="password" placeholder="password" required type="password" /></li>
          <li>Email<input name="email" placeholder="yourname@gmail.com" required type="email" /></li>
          <li><input type="submit" defaultValue="Register" /></li>
        </ul>
      </form>
    )
  }
});

export default Register;
