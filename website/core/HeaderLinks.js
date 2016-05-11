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
var AlgoliaDocSearch = require('AlgoliaDocSearch');

var HeaderLinks = React.createClass({
  linksInternal: [
    {section: 'docs', href: 'docs/getting-started.html', text: 'Docs'},
    {section: 'support', href: 'support.html', text: 'Support'},
    {section: 'showcase', href: 'showcase.html', text: 'Showcase'},
    {section: 'blog', href: 'blog/', text: 'Blog'},
  ],
  linksExternal: [
    {section: 'github', href: 'https://github.com/facebook/react-native', text: 'GitHub'},
    {section: 'react', href: 'http://facebook.github.io/react', text: 'React'},
    {
      section: 'survey',
      href: 'https://www.facebook.com/survey?oid=681969738611332',
      text: 'Take Our Docs Survey'
    }
  ],

  makeLinks: function(links) {
    var surveyStyle = {
      color: '#2AFF48',
    };
    return links.map(function(link) {
      return (
        <li key={link.section}>
          <a
            href={link.href}
            style={link.section === 'survey' ? surveyStyle : null}
            className={link.section === this.props.section ? 'active' : ''}>
            {link.text}
          </a>
        </li>
      );
    }, this);
  },

  render: function() {
    return (
      <div className="nav-site-wrapper">
        <ul className="nav-site nav-site-internal">
          {this.makeLinks(this.linksInternal)}
        </ul>

        <AlgoliaDocSearch />

        <ul className="nav-site nav-site-external">
          {this.makeLinks(this.linksExternal)}
        </ul>
      </div>
    );
  }
});

module.exports = HeaderLinks;
