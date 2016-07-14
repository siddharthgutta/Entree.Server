import NotifierDataStrategy from './notifier-data.es6';

export default class SlackData extends NotifierDataStrategy {
  /**
   * Constructor for creating and initializing a slack data object
   *
   * @returns {SlackData}: returns the SlackData object created
   */
  constructor() {
    super();
    this.attachments = [];
  }

  /**
   * Pushes an empty attachment to the SlackData object
   *
   * @returns {null}: unused
   */
  pushAttachment() {
    this.attachments.push({
      fields: []
    });
  }

  /**
   * Sets the fallback for an attachment
   *
   * @param {String} fallback: fallback text if the attachment fails to send
   * @param {Number} index: index of the attachment to set the fallback for
   * @returns {null}: unused
   */
  setFallback(fallback, index = this.attachments.length - 1) {
    if (index >= this.attachments.length) {
      throw new Error('Cannot set fallback for an attachment that does not exist');
    }
    this.attachments[index].fallback = fallback;
  }

  /**
   * Sets the color for an attachment
   *
   * @param {String} color: color of the attachment
   * @param {Number} index: index of the attachment to set the color for
   * @returns {null}: unused
   */
  setColor(color, index = this.attachments.length - 1) {
    if (index >= this.attachments.length) {
      throw new Error('Cannot set color for an attachment that does not exist');
    }
    this.attachments[index].color = color;
  }

  /**
   * Sets the pretext for an attachment
   *
   * @param {String} pretext: pretext for an attachment
   * @param {Number} index: index of the attachment to set the pretext for
   * @returns {null}: unused
   */
  setPretext(pretext, index = this.attachments.length - 1) {
    if (index >= this.attachments.length) {
      throw new Error('Cannot set pretext for an attachment that does not exist');
    }
    this.attachments[index].mrkdwn_in = ['pretext'];
    this.attachments[index].pretext = pretext;
  }

  /**
   * Adds a field and its value to the SlackData object
   *
   * @param {String} title: title of the field
   * @param {String} value: contents under the field
   * @param {Boolean} short: style of the field added
   * @param {Number} index: index of the attachment to add field to
   * @returns {Null}: unused
   */
  pushField(title, value, short = true, index = this.attachments.length - 1) {
    if (index >= this.attachments.length) {
      throw new Error('Cannot add a field to an attachments that does not exist');
    }
    this.attachments[index].fields.push({title, value, short});
  }

  /**
   * Returns the SlackData object to be sent with the Slack module
   *
   * @returns {{attachments}}: SlackData object
   */
  getData() {
    return {attachments: JSON.stringify(this.attachments)};
  }
}
