/**
 * Created by kfu on 7/18/16.
 */

import React from 'react';

class FBMessenger extends React.Component {
  componentDidMount() {
    this.initializeFacebookButton();
  }

  /**
   * Initializes Facebook Button
   */
  initializeFacebookButton() {
    // Grabs AppId and PageId from the window
    document.getElementById('send-to-messenger-button')
      .setAttribute('messenger_app_id', appId);
    document.getElementById('send-to-messenger-button')
      .setAttribute('page_id', pageId);

    // Facebook Code
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
      <div id="send-to-messenger-button" color="white" size="xlarge" className="fb-messengermessageus" />
    );
  }
};

export default FBMessenger;
