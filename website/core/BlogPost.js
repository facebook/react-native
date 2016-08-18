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

var BlogPost = React.createClass({
  render: function() {
    var post = this.props.post;
    var content = this.props.content;

    var match = post.path.match(/([0-9]+)\/([0-9]+)\/([0-9]+)/);
    // Because JavaScript sucks at date handling :(
    var year = match[1];
    var month = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ][parseInt(match[2], 10) - 1];
    var day = parseInt(match[3], 10);

    var shareURL = '/react-native/blog/' + post.path;
    return (
      <div className="article">
        <p className="meta">
          <a href={post.authorURL} target="_blank"
          className="author">
            {post.author}
          </a>
          {' — '}
          <span className="date">{month} {day}, {year}</span>
        </p>
        <h1>{post.title}</h1>
        <Marked>{content}</Marked>
        <p>
          <div
            className="fb-like"
            data-share="true"
            data-width="450"
            data-show-faces="true">
          </div>
          <a href="https://twitter.com/share" className="twitter-share-button" data-text={post.title} data-url={"http://facebook.github.io/react-native/blog/" + post.path} data-via={post.twitterUsername} data-related="reactnative" data-show-count="false">Tweet</a>
        </p>
      </div>
    );
  }
});

module.exports = BlogPost;
