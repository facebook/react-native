/**
 * @providesModule HeaderLinks
 * @jsx React.DOM
 */

var React = require('React');

var HeaderLinks = React.createClass({
  links: [
    {section: 'docs', href: '/react-native/docs/getting-started.html#content', text: 'docs'},
    {section: 'support', href: '/react-native/support.html', text: 'support'},
    {section: 'github', href: 'http://github.com/facebook/react-native', text: 'github'},
  ],

  render: function() {
    return (
      <ul className="nav-site">
        {this.links.map(function(link) {
          return (
            <li key={link.section}>
              <a
                href={link.href}
                className={link.section === this.props.section ? 'active' : ''}>
                {link.text}
              </a>
            </li>
          );
        }, this)}
      </ul>
    );
  }
});

module.exports = HeaderLinks;
