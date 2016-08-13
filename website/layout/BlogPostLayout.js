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

var BlogPost = require('BlogPost');
var BlogSidebar = require('BlogSidebar');
var Marked = require('Marked');
var MetadataBlog = require('MetadataBlog');
var React = require('React');
var Site = require('Site');

var BlogPostLayout = React.createClass({
  render: function() {
    return (
      <Site
        section="blog"
        title={this.props.metadata.title}
        description={this.props.children.trim().split('\n')[0]}>
        <section className="content wrap documentationContent">
          <BlogSidebar title={this.props.metadata.title} />
          <div className="inner-content">
            <BlogPost post={this.props.metadata} content={this.props.children} />
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = BlogPostLayout;
