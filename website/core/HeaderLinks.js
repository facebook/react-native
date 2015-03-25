/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HeaderLinks
 */

var React = require('React');

var HeaderLinks = React.createClass({
  links: [
    {section: 'docs', href: '/react-native/docs/getting-started.html#content', text: 'docs'},
    {section: 'support', href: '/react-native/support.html', text: 'support'},
    {section: 'react', href: 'http://facebook.github.io/react', text: 'react'},
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
