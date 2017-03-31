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
var BlogPostDate = require('BlogPostDate');

var BlogPostHeader = React.createClass({
  render: function() {
    var post = this.props.post;

    var hero;
    if (post.hero) {
      hero = <img src={post.hero} width="650"/>;
    }

    var title = post.title;
    var href = "/react-native/blog/" + post.path;
    if (this.props.excerpt) {
      title = <a href={href}>{post.title}</a>;
      hero = <a href={href}>{hero}</a>;
    }

    if (post.youtubeVideoId) {
      var embedURL = "https://www.youtube.com/embed/" + post.youtubeVideoId;
      hero = <div className="video-container youtube">
               <iframe id="ytplayer" type="text/html" width="650" height="345"
        src={embedURL}
        frameBorder="0"></iframe>
              </div>;
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
          <BlogPostDate post={post} />
        </h4>
        <h1 className="entry-title">{title}</h1>
      </header>
    );
  }
});

module.exports = BlogPostHeader;
