/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LazyRenderer
 */
'use strict';

var React = require('React');
var TimerMixin = require('react-timer-mixin');

var LazyRenderer = React.createClass({
  mixin: [TimerMixin],

  propTypes: {
    render: React.PropTypes.func.isRequired,
  },

  componentWillMount: function(): void {
    this.setState({
      _lazyRender : true,
    });
  },

  componentDidMount: function(): void {
    requestAnimationFrame(() => {
      this.setState({
        _lazyRender : false,
      });
    });
  },

  render: function(): ?ReactElement {
    return this.state._lazyRender ? null : this.props.render();
  },
});

module.exports = LazyRenderer;
