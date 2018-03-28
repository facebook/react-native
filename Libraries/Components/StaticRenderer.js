/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule StaticRenderer
 * @flow
 */
'use strict';

const React = require('React');

const PropTypes = require('prop-types');

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
