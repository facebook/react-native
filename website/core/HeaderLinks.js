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
'use strict';

var AlgoliaDocSearch = require('AlgoliaDocSearch');
var React = require('React');

var linksInternal = [
  {section: 'docs', href: 'docs/getting-started.html', text: 'Docs', target: '.nav-docs'},
  {section: 'support', href: '/react-native/support.html', text: 'Help'},
  {section: 'blog', href: '/react-native/blog/', text: 'Blog'},
];

var linksExternal = [
  {section: 'github', href: 'https://github.com/facebook/react-native', text: 'GitHub'},
  {section: 'react', href: 'http://facebook.github.io/react', text: 'React'},
];

class HeaderLinks extends React.Component {
  makeLinks(links) {
    return links.map(function(link) {
      return (
        <li key={link.section}>
          <a
            href={link.href}
            className={link.section === this.props.section ? 'active' : ''}
            data-target={link.target}>
            {link.text}
          </a>
        </li>
      );
    }, this);
  }

  render() {
    return (
      <div className="nav-site-wrapper">
        <ul className="nav-site nav-site-internal">
          {this.makeLinks(linksInternal)}
        </ul>

        <AlgoliaDocSearch />

        <ul className="nav-site nav-site-external">
          {this.makeLinks(linksExternal)}
        </ul>
      </div>
    );
  }
}

module.exports = HeaderLinks;
