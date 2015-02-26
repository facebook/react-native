/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TouchableFeedbackPropType
 * @flow
 */
'use strict';

var { PropTypes } = require('React');

var TouchableFeedbackPropType = {
  /**
   * Called when the touch is released, but not if cancelled (e.g. by a scroll
   * that steals the responder lock).
   */
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
  onLongPress: PropTypes.func,
};

module.exports = TouchableFeedbackPropType;
