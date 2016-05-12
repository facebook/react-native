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

var DocsSidebar = require('DocsSidebar');
var HeaderWithGithub = require('HeaderWithGithub');
var Marked = require('Marked');
var React = require('React');
var Site = require('Site');
var Metadata = require('Metadata');

var DocsLayout = React.createClass({
  childContextTypes: {
    permalink: React.PropTypes.string,
    version: React.PropTypes.string
  },

  getChildContext: function() {
    return {
      permalink: this.props.metadata.permalink,
      version: Metadata.config.RN_VERSION || 'next'
    };
  },

  render: function() {
    var metadata = this.props.metadata;
    var content = this.props.children;
    return (
      <Site section="docs" title={metadata.title}>
        <section className="content wrap documentationContent">
          <DocsSidebar metadata={metadata} />
          <div className="inner-content">
            <a id="content" />
            <HeaderWithGithub
              title={metadata.title}
              level={1}
              path={'docs/' + metadata.filename}
            />
            <Marked>{content}</Marked>
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev" href={'docs/' + metadata.previous + '.html#content'}>&larr; Prev</a>}
              {metadata.next && <a className="docs-next" href={'docs/' + metadata.next + '.html#content'}>Next &rarr;</a>}
            </div>
            <div className="survey">
              <div className="survey-image" />
              <p>
                We are planning improvements to the React Native documentation. Your responses to this short survey will go a long way in helping us provide valuable content. Thank you!
              </p>
              <center>
                <a className="button" href="https://www.facebook.com/survey?oid=681969738611332">Take Survey</a>
              </center>
            </div>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = DocsLayout;
