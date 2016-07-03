import NotifierDataStrategy from './notifier-data.es6';
import * as Runtime from '../../libs/runtime.es6';

export default class SlackData extends NotifierDataStrategy {
  /**
   * Constructor for creating and initializing a slack data object
   * @param {String} fallback: fallback text to use if message fails
   * @param {String} color: color of the sidebar for the slack attachment
   * @param {String} pretext: text to place at the before the attachment
   * @returns {SlackData}: returns the SlackData object created
   */
  constructor(fallback, color, pretext) {
    super();
    this.fields = [];
    this.dataType = Runtime.isProduction() ? 'REAL' : 'FAKE';
    this.attachments = [{
      fallback, color, fields: this.fields,
      mrkdwn_in: ['pretext'],
      pretext: `${this.dataType} | ${pretext}`
    }];
  }

  /**
   * Adds a field and its value to the SlackData object
   * @param {String} title: title of the field
   * @param {String} value: contents under the field
   * @param {Boolean} short: style of the field added
   * @returns {Null}: unused
   */
  addFields(title, value, short = true) {
    this.fields.push({title, value, short});
  }

  /**
   * Returns the SlackData object to be sent with the Slack module
   * @returns {{attachments}}: SlackData object
   */
  getData() {
    this.addFields('Environment', Runtime.getEnv());
    this.addFields('Type', this.dataType);
    return {attachments: JSON.stringify(this.attachments)};
  }
}
