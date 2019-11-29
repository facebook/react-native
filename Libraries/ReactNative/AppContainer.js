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
    let logBox = null;
    if (__DEV__ && !this.props.internal_excludeLogBox) {
      if (!global.__RCTProfileIsProfiling) {
        if (global.__reactExperimentalLogBox) {
          const LogBox = require('../LogBox/LogBox');
          logBox = <LogBox />;
        } else {
          const YellowBox = require('../YellowBox/YellowBox');
          logBox = <YellowBox />;
        }
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
    if (global.__reactExperimentalLogBox) {
      const LogBox = require('../LogBox/LogBox');
      LogBox.install();

      // TODO: (rickhanlonii) T57484314 Temporary hack to fix LogBox experiment but we need to
      // either decide to provide an error boundary by default or move this to a separate root.
      AppContainer.getDerivedStateFromError = function getDerivedStateFromError(
        error,
        state,
      ) {
        return {...state, hasError: true};
      };
    } else {
      const YellowBox = require('../YellowBox/YellowBox');
      YellowBox.install();
    }
  }
}

module.exports = AppContainer;
