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
    var content = this.props.content;

    var match = post.publishedAt.match(/([0-9]+)-([0-9]+)-([0-9]+)/);
    // Because JavaScript sucks at date handling :(
    var year = match[1];
    var month = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ][parseInt(match[2], 10) - 1];
    var day = parseInt(match[3], 10);

    var postedOnDate = month + ' ' + day + ', ' + year;

    var footer = <BlogPostFooter post={post} postedOnDate={postedOnDate} />;

    if (this.props.excerpt) {
      content = content.trim().split('\n')[0];
      footer = <ExcerptLink href={'/react-native/blog/' + post.path} category={post.category} />;
    }

    return (
      <article>
        <BlogPostHeader
          post={post}
          postedOnDate={postedOnDate}
          excerpt={this.props.excerpt} />
        <div className="entry-content">
          <Marked>{content}</Marked>
        </div>
        {footer}
      </article>
    );
  }
});

module.exports = BlogPost;
