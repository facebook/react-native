/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlogPost
 */

'use strict';

var Marked = require('Marked');
var React = require('React');
var BlogPostHeader = require('BlogPostHeader');
var BlogPostFooter = require('BlogPostFooter');
var ExcerptLink = require('ExcerptLink');

var BlogPost = React.createClass({
  render: function() {
    var post = this.props.post;

    return (
      <article className="entry-body">
        <BlogPostHeader post={post} />
        <div className="entry-content">
          <Marked>{this.props.content}</Marked>
        </div>
        <BlogPostFooter post={post} />
      </article>
    );
  }
});

module.exports = BlogPost;
