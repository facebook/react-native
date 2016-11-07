/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlogPostLayout
 */

'use strict';

var React = require('React');
var Site = require('Site');
var Hero = require('Hero');
var MetadataBlog = require('MetadataBlog');
var BlogPost = require('BlogPost');
var BlogPostHeader = require('BlogPostHeader');
var Marked = require('Marked');

var BlogPostLayout = React.createClass({
  render: function() {
    return (
      <Site
        section="blog"
        title={this.props.metadata.title}
        description={this.props.metadata.excerpt}
        path={'blog/' + this.props.metadata.path}
        author={this.props.metadata.author}
        authorTwitter={this.props.metadata.authorTwitter}
        image={this.props.metadata.hero ? 'https://facebook.github.io' + this.props.metadata.hero : 'https://facebook.github.io/react-native/img/opengraph.png' }
        >
        <Hero title="React Native Blog" subtitle="Stay up-to-date with the latest React Native news and events." />
        <section className="content wrap documentationContent">
          <BlogPost
            post={this.props.metadata}
            content={this.props.children} />
        </section>
      </Site>
    );
  }
});

module.exports = BlogPostLayout;
