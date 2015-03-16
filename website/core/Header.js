/**
 * @providesModule Header
 * @jsx React.DOM
 */

var React = require('React');
var slugify = require('slugify');

var Header = React.createClass({
  render: function() {
    var slug = slugify(this.props.toSlug || this.props.children);
    var H = 'h' + this.props.level;
    return (
      <H {...this.props}>
        <a className="anchor" name={slug}></a>
        {this.props.children}
        {' '}<a className="hash-link" href={'#' + slug}>#</a>
      </H>
    );
  }
});

module.exports = Header;
