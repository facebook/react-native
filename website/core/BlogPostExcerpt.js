/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlogPostExcerpt
 */

'use strict';

var React = require('React');
var BlogPostHeader = require('BlogPostHeader');
var Marked = require('Marked');
var ExcerptLink = require('ExcerptLink');

var BlogPostExcerpt = React.createClass({
  render: function() {
    var post = this.props.post;
    return (
      <article className="entry-excerpt">
        <BlogPostHeader
          post={post}
          excerpt={true} />
        <div className="entry-content">
          <Marked>{post.excerpt}</Marked>
        </div>
        <ExcerptLink
          href={'/react-native/blog/' + post.path}
          category={post.category} />
      </article>
    );
  }
});

module.exports = BlogPostExcerpt;
