/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {Alert, Button, View} = require('react-native');

class XHRExampleAbortController extends React.Component<{}, {}> {
  _timeout: any;

  _submit(abortDelay) {
    clearTimeout(this._timeout);
    // eslint-disable-next-line no-undef
    const abortController = new AbortController();
    fetch('https://facebook.github.io/react-native/', {
      signal: abortController.signal,
    })
      .then(res => res.text())
      .then(res => Alert.alert(res))
      .catch(err => Alert.alert(err.message));
    this._timeout = setTimeout(() => {
      abortController.abort();
    }, abortDelay);
  }

  componentWillUnmount() {
    clearTimeout(this._timeout);
  }

  render(): React.Node {
    return (
      <View>
        <Button
          title="Abort before response"
          onPress={() => {
            this._submit(0);
          }}
        />
        <Button
          title="Abort after response"
          onPress={() => {
            this._submit(5000);
          }}
        />
      </View>
    );
  }
}

module.exports = XHRExampleAbortController;
