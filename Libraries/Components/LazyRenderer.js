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
var createReactClass = require('create-react-class');
var PropTypes = require('prop-types');
var TimerMixin = require('react-timer-mixin');

var LazyRenderer = createReactClass({
  displayName: 'LazyRenderer',
  mixin: [TimerMixin],

  propTypes: {
    render: PropTypes.func.isRequired,
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

  render: function(): ?React.Element {
    return this.state._lazyRender ? null : this.props.render();
  },
});

module.exports = LazyRenderer;
