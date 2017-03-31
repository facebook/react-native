/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlogPageLayout
 */

'use strict';

var React = require('React');
var Site = require('Site');
var Hero = require('Hero');
var MetadataBlog = require('MetadataBlog');
var BlogPost = require('BlogPost');
var BlogPostExcerpt = require('BlogPostExcerpt');

var BlogPageLayout = React.createClass({
  getPageURL: function(page) {
    var url = '/react-native/blog/';
    if (page > 0) {
      url += 'page' + (page + 1) + '/';
    }
    return url + '#content';
  },

  render: function() {
    var perPage = this.props.metadata.perPage;
    var page = this.props.metadata.page;
    return (
      <Site
        section="blog"
        title="React Native Blog"
        description="The best place to stay up-to-date with the latest React Native news and events.">
        <Hero title="React Native Blog" subtitle="Stay up-to-date with the latest React Native news and events." />
        <section className="content wrap documentationContent">
            {MetadataBlog.files
              .slice(page * perPage, (page + 1) * perPage)
              .map((post) => {
                return (
                  <BlogPostExcerpt post={post} />
                )
              })
            }
            <div className="docs-prevnext">
              {page > 0 &&
                <a className="docs-prev" href={this.getPageURL(page - 1)}>&larr; Newer posts</a>}
              {MetadataBlog.files.length > (page + 1) * perPage &&
                <a className="docs-next" href={this.getPageURL(page + 1)}>Older posts &rarr;</a>}
            </div>
        </section>
      </Site>
    );
  }
});

module.exports = BlogPageLayout;
