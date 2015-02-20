/**
 * @providesModule center
 * @jsx React.DOM
 */

var React = require('React');

var center = React.createClass({
  render: function() {
    return this.transferPropsTo(
      <div style={{textAlign: 'center'}}>{this.props.children}</div>
    );
  }
});

module.exports = center;
