/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlogPostHeader
 */

'use strict';

var React = require('React');

var BlogPostHeader = React.createClass({
  render: function() {
    var post = this.props.post;

    var hero;
    if (post.hero) {
      hero = <img src={post.hero} />;
    }

    return (
      <header className="entry-header">
        {hero}
        <h4 className="entry-authordate">
          <a href={post.authorURL} target="_blank"
          className="author">
            {post.author}
          </a>
          {' — '}
          <span className="date">{this.props.postedOnDate}</span>
        </h4>
        <h1 className="entry-title">{post.title}</h1>
      </header>
    );
  }
});

module.exports = BlogPostHeader;
