import React from 'react';
import Footer from './Footer';
import FBMessenger from './FBMessenger';

class Home extends React.Component {
  render() {
    return (
      <div>
        <header id="header">
          <div className="content">
            <h1><img src="img/entree-header-logo.svg" /></h1>
            <p>Stop Waiting. Start Eating.<br /><br />Order ahead from the best food<br />trucks around you through<br />Facebook Messenger.</p>
            <ul className="actions">
              <li>
                <FBMessenger />
              </li>
            </ul>
          </div>
          <div className="image phone">
            <div className="inner">
              <img src="img/phone_screen.png" alt />
            </div>
          </div>
        </header>
        <Footer />
      </div>
    );
  }
}

export default Home;
