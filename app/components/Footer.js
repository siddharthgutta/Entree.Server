/**
 * Created by kfu on 7/17/16.
 */
import React from 'react';

class Footer extends React.Component {
  render() {
    return (
      <footer id="footer">
        <ul className="icons">
          <li>
            <a href="https://www.facebook.com/entreebot/" className="icon fa-facebook">
              <span className="label">Facebook</span>
            </a>
          </li>
          <li>
            <a href="https://twitter.com/EntreeBot" className="icon fa-twitter">
              <span className="label">Twitter</span>
            </a>
          </li>
        </ul>
        <p className="copyright">© Entree POS Inc.</p>
      </footer>
    );
  }
};

export default Footer;
