/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StaticRenderer
 * @flow
 */
'use strict';

var React = require('React');

var StaticRenderer = React.createClass({
  propTypes: {
    shouldUpdate: React.PropTypes.bool.isRequired,
    render: React.PropTypes.func.isRequired,
  },

  shouldComponentUpdate: function(nextProps: { shouldUpdate: boolean }): boolean {
    return nextProps.shouldUpdate;
  },

  render: function(): ReactElement<any> {
    return this.props.render();
  },
});

module.exports = StaticRenderer;
