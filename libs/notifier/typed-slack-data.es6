/**
 * Created by kfu on 7/6/16.
 */

import SlackData from './slack-data.es6';
import * as Runtime from '../../libs/runtime.es6';

const dataType = `${Runtime.isProduction() ? 'REAL' : 'FAKE'}`;

export default class TypedSlackData extends SlackData {
  /**
   * Constructor for creating and initializing a slack data object
   *
   * @returns {TypedSlackData}: returns the TypedSlackData object created
   */
  constructor() {
    super();
  }

  /**
   * Pushes an attachment with color and pretext
   *
   * @returns {null}: unused
   */
  pushAttachment() {
    super.pushAttachment();
    super.pushField('Environment', Runtime.getEnv());
    super.pushField('Type', dataType);
  }

  /**
   * Sets the pretext for the attachment
   * @param {String} pretext: pretext of the attachment
   * @returns {null}: unused
   */
  setPretext(pretext) {
    super.setPretext(`${dataType} | ${pretext}`);
  }

  /**
   * Sets the fallback for an attachment
   *
   * @param {String} fallback: fallback for an attachment
   * @returns {null}: unused
   */
  setFallback(fallback) {
    super.setFallback(`${dataType} | ${fallback}`);
  }

  /**
   * Adds a field and its value to the SlackData object
   *
   * @param {String} title: title of the field
   * @param {String} value: contents under the field
   * @param {Boolean} short: style of the field added
   * @returns {Null}: unused
   */
  pushField(title, value, short = true) {
    super.pushField(title, value, short);
  }

  /**
   * Returns the SlackData object to be sent with the Slack module
   *
   * @returns {{attachments}}: SlackData object
   */
  getData() {
    return super.getData();
  }
}
