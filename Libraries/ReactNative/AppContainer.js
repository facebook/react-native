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
const RootTagContext = require('./RootTagContext');
const StyleSheet = require('../StyleSheet/StyleSheet');
const View = require('../Components/View/View');

type Context = {rootTag: number, ...};

type Props = $ReadOnly<{|
  children?: React.Node,
  fabric?: boolean,
  rootTag: number,
  showArchitectureIndicator?: boolean,
  WrapperComponent?: ?React.ComponentType<any>,
  internal_excludeLogBox?: ?boolean,
|}>;

type State = {|
  inspector: ?React.Node,
  mainKey: number,
  hasError: boolean,
|};

class AppContainer extends React.Component<Props, State> {
  state: State = {
    inspector: null,
    mainKey: 1,
    hasError: false,
  };
  _mainRef: ?React.ElementRef<typeof View>;
  _subscription: ?EmitterSubscription = null;

  static getDerivedStateFromError: any = undefined;

  static childContextTypes:
    | any
    | {|rootTag: React$PropType$Primitive<number>|} = {
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
                inspectedView={this._mainRef}
                onRequestRerenderApp={updateInspectedView => {
                  this.setState(
                    s => ({mainKey: s.mainKey + 1}),
                    () => updateInspectedView(this._mainRef),
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
    let logBox = null;
    if (__DEV__) {
      if (
        !global.__RCTProfileIsProfiling &&
        !this.props.internal_excludeLogBox
      ) {
        const LogBoxNotificationContainer = require('../LogBox/LogBoxNotificationContainer')
          .default;
        logBox = <LogBoxNotificationContainer />;
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
      innerView = (
        <Wrapper
          fabric={this.props.fabric === true}
          showArchitectureIndicator={
            this.props.showArchitectureIndicator === true
          }>
          {innerView}
        </Wrapper>
      );
    }
    return (
      <RootTagContext.Provider value={this.props.rootTag}>
        <View style={styles.appContainer} pointerEvents="box-none">
          {!this.state.hasError && innerView}
          {this.state.inspector}
          {logBox}
        </View>
      </RootTagContext.Provider>
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
    const LogBox = require('../LogBox/LogBox');
    LogBox.install();
  }
}

module.exports = AppContainer;
