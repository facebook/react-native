/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @provides StaticRenderer
 */
'use strict';

var React = require('React');

var StaticRenderer = React.createClass({
  propTypes: {
    shouldUpdate: React.PropTypes.bool.isRequired,
    render: React.PropTypes.func.isRequired,
  },

  shouldComponentUpdate: function(nextProps) {
    return nextProps.shouldUpdate;
  },

  render: function() {
    return this.props.render();
  },
});

module.exports = StaticRenderer;
