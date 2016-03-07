/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var React = require('React');
var Site = require('Site');
var center = require('center');

var support = React.createClass({
  childContextTypes: {
    permalink: React.PropTypes.string
  },

  getChildContext: function() {
    return {permalink: 'support.html'};
  },

  render: function() {
    return (
      <Site section="feedback" title="Feedback">
        <section className="content wrap documentationContent nosidebar">
          <div className="inner-content">
            <h1>Feedback</h1>
            <div className="subHeader"></div>
            <p><strong>React Native</strong> uses <a href="https://productpains.com/product/react-native/">Product Pains</a> for feature requests. It has a voting system to surface which issues are most important to the community. GitHub issues should only be used for bugs.</p>
            <iframe
              width="100%"
              height="360px"
              scrolling="no"
              src="https://productpains.com/widget.html?token=3b929306-e0f7-5c94-7d7c-ecc05d059748"
            />
            <script
              type="text/javascript"
              src="https://productpains.com/js/lib/iframeResizer.min.js"
            />
          </div>
        </section>
      </Site>
    );
  },
});

module.exports = support;
