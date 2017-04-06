/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SnackPlayer
 */
'use strict';

var Prism = require('Prism');
var React = require('React');

const LatestSDKVersion = '15.0.0';
var ReactNativeToExpoSDKVersionMap = {
  '0.42': '15.0.0',
  '0.41': '14.0.0',
};

/**
 * Use the SnackPlayer by including a ```SnackPlayer``` block in markdown.
 *
 * Optionally, include url parameters directly after the block's language.
 * Valid options are name, description, and platform.
 *
 * E.g.
 * ```SnackPlayer?platform=android&name=Hello%20world!
 * import React from 'react';
 * import { Text } from 'react-native';
 *
 * export default class App extends React.Component {
 *   render() {
 *     return <Text>Hello World!</Text>;
 *   }
 * }
 * ```
 */
var SnackPlayer = React.createClass({
  contextTypes: {
    version: React.PropTypes.number.isRequired,
  },

  componentDidMount() {
    window.ExpoSnack && window.ExpoSnack.initialize();
  },

  render() {
    var code = encodeURIComponent(this.props.children);
    var params = this.parseParams(this.props.params);
    var platform = params.platform ? params.platform : 'ios';
    var name = params.name ? decodeURIComponent(params.name) : 'Example';
    var description = params.description
      ? decodeURIComponent(params.description)
      : 'Example usage';

    var optionalProps = {};
    var { version } = this.context;
    if (version === 'next') {
      optionalProps['data-snack-sdk-version'] = LatestSDKVersion;
    } else {
      optionalProps['data-snack-sdk-version'] = ReactNativeToExpoSDKVersionMap[
        version
      ] || LatestSDKVersion;
    }

    return (
      <div className="snack-player">
        <div className="mobile-friendly-snack" style={{ display: 'none' }}>
          <Prism>
            {this.props.children}
          </Prism>
        </div>

        <div
          className="desktop-friendly-snack"
          style={{ marginTop: 15, marginBottom: 15 }}>
          <div
            data-snack-name={name}
            data-snack-description={description}
            data-snack-code={code}
            data-snack-platform={platform}
            data-snack-preview="true"
            {...optionalProps}
            style={{
              overflow: 'hidden',
              background: '#fafafa',
              border: '1px solid rgba(0,0,0,.16)',
              borderRadius: '4px',
              height: '514px',
              width: '880px',
            }}
          />
        </div>
      </div>
    );
  },

  parseParams: function(paramString) {
    var params = {};

    if (paramString) {
      var pairs = paramString.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        params[pair[0]] = pair[1];
      }
    }

    return params;
  },
});

module.exports = SnackPlayer;
