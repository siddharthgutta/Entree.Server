import React from 'react';

class Home extends React.Component {
  componentDidMount() {
    console.log('Inside component Did Mount');
    document.getElementById('send-to-messenger-button')
      .setAttribute('messenger_app_id', appId);
    document.getElementById('send-to-messenger-button')
      .setAttribute('page_id', pageId);

    window.fbAsyncInit = function() {
      FB.init({
        appId: appId,
        xfbml: true,
        version: "v2.6"
      });
    };

    (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  render() {
    return (
      <div>
        <header id="header">
          <div className="content">
            <h1><img src="img/entree-header-logo.svg" /></h1>
            <p>Stop Waiting. Start Eating.<br /><br />Order ahead from the best food<br />trucks around you through<br />Facebook Messenger.</p>
            <ul className="actions">
              <li>
                <div id="send-to-messenger-button" color="white" size="xlarge" className="fb-messengermessageus" />
              </li>
            </ul>
          </div>
          <div className="image phone">
            <div className="inner">
              <img src="img/phone_screen.png" alt />
            </div>
          </div>
        </header>
        <footer id="footer">
          <ul className="icons">
            <li><a href="https://www.facebook.com/entreebot/" className="icon fa-facebook"><span className="label">Facebook</span></a></li>
            <li><a href="https://twitter.com/EntreeBot" className="icon fa-twitter"><span className="label">Twitter</span></a></li>
          </ul>
          <p className="copyright">© Entree POS Inc.</p>
        </footer>
      </div>
    );
  }
}

export default Home;
