/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReadMoreLink
 */

'use strict';

var React = require('React');

var ReadMoreLink = React.createClass({
  render: function() {
    return (
      <footer className="entry-readmore">
        <a href={this.props.href} className="btn">
          Read more
        </a>
      </footer>
    );
  }
});

module.exports = ReadMoreLink;
