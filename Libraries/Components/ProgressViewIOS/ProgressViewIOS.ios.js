/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ProgressViewIOS
 * @flow
 */
'use strict';

var Image = require('Image');
var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModules = require('NativeModules');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var StyleSheet = require('StyleSheet');

var requireNativeComponent = require('requireNativeComponent');
var verifyPropTypes = require('verifyPropTypes');

/**
 * Use `ProgressViewIOS` to render a UIProgressView on iOS.
 */
var ProgressViewIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    /**
     * The progress bar style.
     */
    progressViewStyle: PropTypes.oneOf(['default', 'bar']),

    /**
     * The progress value (between 0 and 1).
     */
    progress: PropTypes.number,

    /**
     * The tint color of the progress bar itself.
     */
    progressTintColor: PropTypes.string,

    /**
     * The tint color of the progress bar track.
     */
    trackTintColor: PropTypes.string,

    /**
     * A stretchable image to display as the progress bar.
     */
    progressImage: Image.propTypes.source,

    /**
     * A stretchable image to display behind the progress bar.
     */
    trackImage: Image.propTypes.source,
  },

  render: function() {
    return (
      <RCTProgressView
        {...this.props}
        style={[styles.progressView, this.props.style]}
      />
    );
  }
});

var styles = StyleSheet.create({
  progressView: {
    height: NativeModules.ProgressViewManager.ComponentHeight
  },
});

var RCTProgressView = requireNativeComponent(
  'RCTProgressView',
  ProgressViewIOS
);

module.exports = ProgressViewIOS;
