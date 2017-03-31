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
var BlogPostDate = require('BlogPostDate');

var BlogPostFooter = React.createClass({
  render: function() {
    var post = this.props.post;

    var authorImage = this.props.post.authorImage ? this.props.post.authorImage : '/react-native/img/author.png';

    var authorNameTitleSeparator = '';
    var authorTitle;
    if (this.props.post.authorTitle) {
      authorNameTitleSeparator = ', ';
      authorTitle = <span className="title">{this.props.post.authorTitle}</span>;
    }

    return (
      <div>
        <aside className="author-info">
          <div className="author-image">
            <span className="the-image" style={{backgroundImage: "url(" + authorImage + ")"}}></span>
          </div>
          <p className="posted-on">Posted on <BlogPostDate post={post} /></p>
          <p className="name-title">
            <a href={post.authorURL} target="_blank">
              {post.author}
            </a>
            { authorNameTitleSeparator }
            { authorTitle }
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
