/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RedirectLayout
 */
'use strict';

var React = require('React');

var RedirectLayout = React.createClass({
  render: function() {
    var destinationUrl = this.props.metadata.destinationUrl;

    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <link rel="canonical" href={ destinationUrl } />
          <meta httpEquiv="refresh" content={'0; url=' + destinationUrl} />
          <title>Redirecting...</title>
        </head>
        <body>
          <h1>Redirecting...</h1>
          <a href={ destinationUrl }>Click here if you are not redirected.</a>
          <script dangerouslySetInnerHTML={{__html: 'location=' + destinationUrl}} />
        </body>
      </html>
    );
  }
});

module.exports = RedirectLayout;
