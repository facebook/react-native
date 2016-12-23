/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppContainer
 * @flow
 */

'use strict';

const EmitterSubscription = require('EmitterSubscription');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');
const View = require('View');

type Context = {
  rootTag: number,
};
type Props = {
  children?: React.Children,
  rootTag: number,
};
type State = {
  inspector: ?React.Element<*>,
  mainKey: number,
};

class AppContainer extends React.Component {
  props: Props;
  state: State = {
    inspector: null,
    mainKey: 1,
  };
  _mainRef: ?React.Element<*>;
  _subscription: ?EmitterSubscription = null;

  static childContextTypes = {
    rootTag: React.PropTypes.number,
  };

  getChildContext(): Context {
    return {
      rootTag: this.props.rootTag,
    };
  }

  componentDidMount(): void {
    if (__DEV__) {
      this._subscription = RCTDeviceEventEmitter.addListener(
        'toggleElementInspector',
        () => {
          const Inspector = require('Inspector');
          const inspector = this.state.inspector
            ? null
            : <Inspector
                inspectedViewTag={ReactNative.findNodeHandle(this._mainRef)}
                onRequestRerenderApp={(updateInspectedViewTag) => {
                  this.setState(
                    (s) => ({mainKey: s.mainKey + 1}),
                    () => updateInspectedViewTag(
                      ReactNative.findNodeHandle(this._mainRef)
                    )
                  );
                }}
              />;
          this.setState({inspector});
        },
      );
    }
  }

  componentWillUnmount(): void {
    if (this._subscription) {
      this._subscription.remove();
    }
  }

  render(): React.Element<*> {
    let yellowBox = null;
    if (__DEV__) {
      const YellowBox = require('YellowBox');
      yellowBox = <YellowBox />;
    }

    return (
      <View style={styles.appContainer}>
        <View
          collapsable={!this.state.inspector}
          key={this.state.mainKey}
          style={styles.appContainer} ref={(ref) => {this._mainRef = ref;}}>
          {this.props.children}
        </View>
        {yellowBox}
        {this.state.inspector}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});

module.exports = AppContainer;
