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

var PropTypes = require('prop-types');

class StaticRenderer extends React.Component<{
  shouldUpdate: boolean,
  render: Function,
}> {
  static propTypes = {
    shouldUpdate: PropTypes.bool.isRequired,
    render: PropTypes.func.isRequired,
  };

  shouldComponentUpdate(nextProps: { shouldUpdate: boolean }): boolean {
    return nextProps.shouldUpdate;
  }

  render(): React.Node {
    return this.props.render();
  }
}

module.exports = StaticRenderer;
