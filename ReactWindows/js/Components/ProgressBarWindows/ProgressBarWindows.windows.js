/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ProgressBarWindows
 * @flow
 */
'use strict';

var React = require('React');
var ReactPropTypes = require('ReactPropTypes');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var View = require('View');
var ColorPropType = require('ColorPropType');

var requireNativeComponent = require('requireNativeComponent');

/**
 * React component that wraps the Windows-only `ProgressBar`. This component is used to indicate
 * that the app is loading or there is some activity in the app.
 */
var ProgressBarWindows = React.createClass({
  propTypes: {
    ...View.propTypes,
    
    /**
     * If the progress bar will show indeterminate progress.
     */
    indeterminate: ReactPropTypes.bool,
    /**
     * The progress value (between 0 and 100).
     */
    progress: ReactPropTypes.number,
    /**
     * Color of the progress bar.
     */
    color: ColorPropType,
  },
  
  getDefaultProps: function() {
    return {
      indeterminate: true
    };
  },
  
  render: function() {
    return <WindowsProgressBar {...this.props}/> ;
  },
});

var WindowsProgressBar = requireNativeComponent('WindowsProgressBar', ProgressBarWindows);

module.exports = ProgressBarWindows;
