/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DocsSidebar
 */
'use strict';

var Metadata = require('Metadata');
var React = require('React');

var DocsSidebar = React.createClass({
  getCategories: function() {
    var metadatas = Metadata.files.filter(function(metadata) {
      return metadata.layout === 'docs' || metadata.layout === 'autodocs';
    });

    // Build a hashmap of article_id -> metadata
    var articles = {};
    for (var i = 0; i < metadatas.length; ++i) {
      var metadata = metadatas[i];
      articles[metadata.id] = metadata;
    }

    // Build a hashmap of article_id -> previous_id
    var previous = {};
    for (var i = 0; i < metadatas.length; ++i) {
      var metadata = metadatas[i];
      if (metadata.next) {
        if (!articles[metadata.next]) {
          throw '`next: ' + metadata.next + '` in ' + metadata.id + ' doesn\'t exist';
        }
        previous[articles[metadata.next].id] = metadata.id;
      }
    }

    // Find the first element which doesn't have any previous
    var first = null;
    for (var i = 0; i < metadatas.length; ++i) {
      var metadata = metadatas[i];
      if (!previous[metadata.id]) {
        first = metadata;
        break;
      }
    }

    var categories = [];
    var currentCategory = null;

    var metadata = first;
    var i = 0;
    while (metadata && i++ < 1000) {
      if (!currentCategory || metadata.category !== currentCategory.name) {
        currentCategory && categories.push(currentCategory);
        currentCategory = {
          name: metadata.category,
          links: []
        };
      }
      currentCategory.links.push(metadata);
      metadata = articles[metadata.next];
    }
    categories.push(currentCategory);

    return categories;
  },

  getLink: function(metadata) {
    return metadata.permalink;
  },

  render: function() {
    return <div className="nav-docs">
      <div className="nav-docs-viewport">
        {this.getCategories().map((category) =>
          <div className="nav-docs-section" key={category.name}>
            <h3>{category.name}</h3>
            <ul>
              {category.links.map((metadata) =>
                <li key={metadata.id}>
                  <a
                    style={{marginLeft: 10}}
                    target={metadata.permalink.match(/^https?:/) && '_blank'}
                    className={metadata.id === this.props.metadata.id ? 'active' : ''}
                    href={this.getLink(metadata)}>
                    {metadata.title}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>;
  }
});

module.exports = DocsSidebar;
