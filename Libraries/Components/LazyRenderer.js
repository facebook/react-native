/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule LazyRenderer
 */
'use strict';

const React = require('React');
const createReactClass = require('create-react-class');
const PropTypes = require('prop-types');
const TimerMixin = require('react-timer-mixin');

const LazyRenderer = createReactClass({
  displayName: 'LazyRenderer',
  mixin: [TimerMixin],

  propTypes: {
    render: PropTypes.func.isRequired,
  },

  UNSAFE_componentWillMount: function(): void {
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
