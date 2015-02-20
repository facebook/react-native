/**
 * @providesModule H2
 * @jsx React.DOM
 */

var React = require('React');
var Header = require('Header');

var H2 = React.createClass({
  render: function() {
    return this.transferPropsTo(
      <Header level={2}>{this.props.children}</Header>
    );
  }
});

module.exports = H2;
