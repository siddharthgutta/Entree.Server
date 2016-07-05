/**
 * Created by kfu on 7/4/16.
 */

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