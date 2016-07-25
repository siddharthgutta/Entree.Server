import React from 'react';

class LoginSuccess extends React.Component {
  render() {
    return (
      <div>
        <h1>You have successfully logged in</h1>
        <form name='logout' method='get' action='/login/logout'>
          <input type='submit' value='logout'/>
        </form>
      </div>
    )
  }
}

export default LoginSuccess;
