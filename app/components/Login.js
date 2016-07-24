import React from 'react';

class Login extends React.Component {
	render() {
		return (
			<form name='login' method='post' action='/login'>
				<h3>Login</h3>
				<ul>
					<li>Username<input type='username' name='username' placeholder='yourname'></input></li>
					<li>Password<input type='password' name='password' placeholder='password'></input></li>
					<li><input type='submit' value='Login'></input></li>
				</ul>
			</form>
		)
	}
}

export default Login;
