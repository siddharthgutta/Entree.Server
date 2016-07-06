/**
 * Created by kfu on 7/1/16.
 */

export default class CallToAction {
  /**
   * Constructor for Call To Action Data
   *
   * @returns {CallToAction} call to action object
   */
  constructor() {
    this.callToActions = [];
  }

  /**
   * Add a call to action to the call to action array
   *
   * @param {Object} callToActionData: data of the call to action to be added
   * @private
   * @return {Null} unused return statement
   */
  _pushCallToAction(callToActionData) {
    this.callToActions.push(callToActionData);
  }

  /**
   * Adding a call to action button the buttons array
   *
   * @param {String} title: REQUIRED call to action title
   * @param {String} payload: REQUIRED data that will be sent back to us via webhook, when clicked
   * @return {Null} unused return statement
   */
  pushPostbackButton(title, payload) {
    this._pushCallToAction({
      type: 'postback',
      title,
      payload
    });
  }

  /**
   * Adding a link button to the call to actions array
   *
   * @param {String} title: REQUIRED call to action title
   * @param {String} url: REQUIRED url is opened in a mobile browser when the call to action is tapped
   * @return {Null} unused return statement
   */
  pushLinkButton(title, url) {
    this._pushCallToAction({
      type: 'web_url',
      title,
      url
    });
  }

  toJSON() {
    return this.callToActions;
  }
}
