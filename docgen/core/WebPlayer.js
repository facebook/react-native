/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WebPlayer
 */
'use strict';

var Prism = require('Prism');
var React = require('React');

var WEB_PLAYER_VERSION = '1.2.6';

/**
 * Use the WebPlayer by including a ```ReactNativeWebPlayer``` block in markdown.
 *
 * Optionally, include url parameters directly after the block's language. For
 * the complete list of url parameters, see: https://github.com/dabbott/react-native-web-player
 *
 * E.g.
 * ```ReactNativeWebPlayer?platform=android
 * import React from 'react';
 * import { AppRegistry, Text } from 'react-native';
 *
 * const App = () => <Text>Hello World!</Text>;
 *
 * AppRegistry.registerComponent('MyApp', () => App);
 * ```
 */
class WebPlayer extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.parseParams = this.parseParams.bind(this);
  }

  parseParams(paramString) {
    var params = {};

    if (paramString) {
      var pairs = paramString.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        params[pair[0]] = pair[1];
      }
    }

    return params;
  }

  render() {
    var hash = `#code=${encodeURIComponent(this.props.children)}`;

    if (this.props.params) {
      hash += `&${this.props.params}`;
    }

    return (
      <div className={'web-player'}>
        <Prism>{this.props.children}</Prism>
        <iframe
          style={{marginTop: 4}}
          width="880"
          height={this.parseParams(this.props.params).platform === 'android' ? '425' : '420'}
          data-src={`//cdn.rawgit.com/dabbott/react-native-web-player/gh-v${WEB_PLAYER_VERSION}/index.html${hash}`}
          frameBorder="0"
        />
      </div>
    );
  }
}

module.exports = WebPlayer;
