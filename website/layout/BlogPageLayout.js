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

var BlogPost = require('BlogPost');
var BlogSidebar = require('BlogSidebar');
var MetadataBlog = require('MetadataBlog');
var React = require('React');
var Site = require('Site');

var BlogPageLayout = React.createClass({
  getPageURL: function(page) {
    var url = '/jest/blog/';
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
        title="Blog">
        <section className="content wrap documentationContent">
          <BlogSidebar />
          <div className="inner-content">
            {MetadataBlog.files
              .slice(page * perPage, (page + 1) * perPage)
              .map((post) => {
                return <BlogPost post={post} content={post.content} />
              })
            }
            <div className="docs-prevnext">
              {page > 0 &&
                <a className="docs-prev" href={this.getPageURL(page - 1)}>&larr; Prev</a>}
              {MetadataBlog.files.length > (page + 1) * perPage &&
                <a className="docs-next" href={this.getPageURL(page + 1)}>Next &rarr;</a>}
            </div>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = BlogPageLayout;
