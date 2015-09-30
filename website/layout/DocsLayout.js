/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DocsLayout
 */

var React = require('React');
var Site = require('Site');
var Marked = require('Marked');
var DocsSidebar = require('DocsSidebar');
var DocsLayout = React.createClass({
  render: function() {
    var metadata = this.props.metadata;
    var content = this.props.children;
    return (
      <Site section="docs" title={metadata.title}>
        <section className="content wrap documentationContent">
          <DocsSidebar metadata={metadata} />
          <div className="inner-content">
            <a id="content" />
            <h1>{metadata.title}</h1>
            <Marked>{content}</Marked>
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev" href={metadata.previous + '.html#content'}>&larr; Prev</a>}
              {metadata.next && <a className="docs-next" href={metadata.next + '.html#content'}>Next &rarr;</a>}
            </div>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = DocsLayout;
