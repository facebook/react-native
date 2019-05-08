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

const EmitterSubscription = require('../vendor/emitter/EmitterSubscription');
const PropTypes = require('prop-types');
const RCTDeviceEventEmitter = require('../EventEmitter/RCTDeviceEventEmitter');
const React = require('react');
const ReactNative = require('../Renderer/shims/ReactNative');
const StyleSheet = require('../StyleSheet/StyleSheet');
const View = require('../Components/View/View');

type Context = {
  rootTag: number,
};

type Props = $ReadOnly<{|
  children?: React.Node,
  rootTag: number,
  WrapperComponent?: ?React.ComponentType<any>,
|}>;

type State = {|
  inspector: ?React.Node,
  mainKey: number,
|};

class AppContainer extends React.Component<Props, State> {
  state: State = {
    inspector: null,
    mainKey: 1,
  };
  _mainRef: ?React.ElementRef<typeof View>;
  _subscription: ?EmitterSubscription = null;

  static childContextTypes = {
    rootTag: PropTypes.number,
  };

  getChildContext(): Context {
    return {
      rootTag: this.props.rootTag,
    };
  }

  componentDidMount(): void {
    if (__DEV__) {
      if (!global.__RCTProfileIsProfiling) {
        this._subscription = RCTDeviceEventEmitter.addListener(
          'toggleElementInspector',
          () => {
            const Inspector = require('../Inspector/Inspector');
            const inspector = this.state.inspector ? null : (
              <Inspector
                inspectedViewTag={ReactNative.findNodeHandle(this._mainRef)}
                onRequestRerenderApp={updateInspectedViewTag => {
                  this.setState(
                    s => ({mainKey: s.mainKey + 1}),
                    () =>
                      updateInspectedViewTag(
                        ReactNative.findNodeHandle(this._mainRef),
                      ),
                  );
                }}
              />
            );
            this.setState({inspector});
          },
        );
      }
    }
  }

  componentWillUnmount(): void {
    if (this._subscription != null) {
      this._subscription.remove();
    }
  }

  render(): React.Node {
    let yellowBox = null;
    if (__DEV__) {
      if (!global.__RCTProfileIsProfiling) {
        const YellowBox = require('../YellowBox/YellowBox');
        yellowBox = <YellowBox />;
      }
    }

    let innerView = (
      <View
        collapsable={!this.state.inspector}
        key={this.state.mainKey}
        pointerEvents="box-none"
        style={styles.appContainer}
        ref={ref => {
          this._mainRef = ref;
        }}>
        {this.props.children}
      </View>
    );

    const Wrapper = this.props.WrapperComponent;
    if (Wrapper != null) {
      innerView = <Wrapper>{innerView}</Wrapper>;
    }
    return (
      <View style={styles.appContainer} pointerEvents="box-none">
        {innerView}
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

if (__DEV__) {
  if (!global.__RCTProfileIsProfiling) {
    const YellowBox = require('../YellowBox/YellowBox');
    YellowBox.install();
  }
}

module.exports = AppContainer;
