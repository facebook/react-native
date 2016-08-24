/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlogPostFooter
 */

'use strict';

var React = require('React');

var BlogPostFooter = React.createClass({
  render: function() {
    var post = this.props.post;

    return (
      <div>
        <aside className="author-info">
          <p className="posted-on">Posted on {this.props.postedOnDate}</p>
          <p className="name-title">
            <a href={post.authorURL} target="_blank">
              {post.author}
            </a>
          </p>
        </aside>
        <aside className="entry-share">
          <h3 className="small-title">Share this post</h3>
          <div className="social-buttons">
            <div
              className="fb-like"
              data-layout="standard"
              data-share="true"
              data-width="225"
              data-show-faces="false">
            </div>
            <a href="https://twitter.com/share" className="twitter-share-button" data-text={post.title} data-url={"http://facebook.github.io/react-native/blog/" + post.path} data-via={post.authorTwitter} data-related="reactnative" data-show-count="false">Tweet</a>
          </div>
        </aside>
      </div>
    );
  }
});

module.exports = BlogPostFooter;
