import React from 'react';

class LoginSuccess extends React.Component {
	render() {
		return (
			<form name='logout' method='get' action='/login/logout'>
				<h1>You have successfully logged in</h1>
					<input type='submit' value='logout'></input>
			</form>
		)
	}
}

export default LoginSuccess;
