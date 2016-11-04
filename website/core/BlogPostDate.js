/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlogPostDate
 */

'use strict';

var React = require('React');

var BlogPostDate = React.createClass({
  render: function() {
    var post = this.props.post;

    var match = post.publishedAt.match(/([0-9]+)-([0-9]+)-([0-9]+)/);
    // Because JavaScript sucks at date handling :(
    var year = match[1];
    var month = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ][parseInt(match[2], 10) - 1];
    var day = parseInt(match[3], 10);

    var postedOnDate = month + ' ' + day + ', ' + year;

    return (
      <time className="date" datetime={post.publishedAt}>{postedOnDate}</time>
    );
  }
});

module.exports = BlogPostDate;
