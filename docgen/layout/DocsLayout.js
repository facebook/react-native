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
'use strict';

var DocsSidebar = require('DocsSidebar');
var EjectBanner = require('EjectBanner');
var Footer = require('Footer');
var Header = require('Header');
var Marked = require('Marked');
var Metadata = require('Metadata');
var React = require('React');
var PropTypes = require('prop-types');
var Site = require('Site');

class DocsLayout extends React.Component {
  getChildContext() {
    return {
      permalink: this.props.metadata.permalink,
      version: Metadata.config.RN_VERSION || 'next'
    };
  }

  render() {
    var metadata = this.props.metadata;
    var content = this.props.children;
    return (
      <Site
        category={metadata.category}
        title={metadata.title} >
        <div className="inner-content" id="componentContent">
          <Marked>{content}</Marked>
        </div>
      </Site>
    );
  }
}

DocsLayout.childContextTypes = {
  permalink: PropTypes.string,
  version: PropTypes.string
};

module.exports = DocsLayout;
