/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlogSidebar
 */

'use strict';

var MetadataBlog = require('MetadataBlog');
var React = require('React');

var BlogSidebar = React.createClass({
  render: function() {
    return (
      <div className="nav-docs">
        <div className="nav-docs-section">
          <h3>Recent Posts</h3>
          <ul>
            {MetadataBlog.files.map(function(post) {
              return (
                <li key={post.path}>
                  <a
                    className={this.props.title === post.title ? 'active' : ''}
                    href={'/react-native/blog/' + post.path}>
                    {post.title}
                  </a>
                </li>
              );
            }.bind(this))}
          </ul>
        </div>
      </div>
    );
  }
});

module.exports = BlogSidebar;
