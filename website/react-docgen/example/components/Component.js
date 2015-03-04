var React = require('react');
var Foo = require('Foo');

/**
 * General component description.
 */
var Component = React.createClass({
  propTypes: {
    ...Foo.propTypes,
    /**
     * Prop description
     */
    bar: React.PropTypes.number
  },

  getDefaultProps: function() {
    return {
      bar: 21
    };
  },

  render: function() {
    // ...
  }
});

module.exports = Component;
