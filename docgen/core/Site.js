/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Site
 */
'use strict';

var HeaderLinks = require('HeaderLinks');
var Metadata = require('Metadata');
var React = require('React');

class Site extends React.Component {
  render() {
    const path = Metadata.config.RN_DEPLOYMENT_PATH;

    var basePath = '/react-native/' +
      (path ? path + '/' : '');


    var title = this.props.title
      ? this.props.title
      : 'React Native | A framework for building native apps using React';

    return (
      <html>
        <head>
          <title>{title}</title>
          <base href={basePath} />
          <link
            rel="stylesheet"
            href="css/react-native.css"
          />
          <link rel="stylesheet" href="css/prism.css" />
          <meta property="rn:category" content={this.props.category} />
        </head>
        <body>
          {this.props.children}
        </body>
      </html>
    );
  }
}

module.exports = Site;
