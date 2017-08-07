/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var React = require('React');

class fourOhFour extends React.Component {
  render() {
    return (
      <html>
        <head>
          <meta httpEquiv="refresh" content="0; /react-native/docs/getting-started.html" />
        </head>
        <body />
      </html>
    );
  }
}

module.exports = fourOhFour;
