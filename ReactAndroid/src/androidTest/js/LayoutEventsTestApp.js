/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LayoutEventsTestApp
 */

'use strict';

var React = require('React');
var View = require('View');

var RecordingModule = require('NativeModules').Recording;

var LayoutEventsTestApp = React.createClass({
  handleOnLayout: function(e) {
    var layout = e.nativeEvent.layout;
    RecordingModule.record(layout.x + ',' + layout.y + '-' + layout.width + 'x' + layout.height);
  },

  render: function() {
    return (
        <View
            onLayout={this.handleOnLayout}
            testID="container"
            style={{left: 10, top: 10, width: 100, height: 100}}/>
    );
  },
});

module.exports = LayoutEventsTestApp;
