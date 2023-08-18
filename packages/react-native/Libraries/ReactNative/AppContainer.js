/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {RootTag} from './RootTag';

import View from '../Components/View/View';
import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import StyleSheet from '../StyleSheet/StyleSheet';
import {type EventSubscription} from '../vendor/emitter/EventEmitter';
import {RootTagContext, createRootTag} from './RootTag';
import * as React from 'react';

const reactDevToolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

type Props = $ReadOnly<{|
  children?: React.Node,
  fabric?: boolean,
  useConcurrentRoot?: boolean,
  rootTag: number | RootTag,
  initialProps?: {...},
  showArchitectureIndicator?: boolean,
  WrapperComponent?: ?React.ComponentType<any>,
  internal_excludeLogBox?: ?boolean,
  internal_excludeInspector?: ?boolean,
|}>;

type State = {|
  inspector: ?React.Node,
  devtoolsOverlay: ?React.Node,
  traceUpdateOverlay: ?React.Node,
  mainKey: number,
|};

class AppContainer extends React.Component<Props, State> {
  state: State = {
    inspector: null,
    devtoolsOverlay: null,
    traceUpdateOverlay: null,
    mainKey: 1,
  };
  _mainRef: ?React.ElementRef<typeof View>;
  _subscription: ?EventSubscription = null;
  _reactDevToolsAgentListener: ?() => void = null;

  static getDerivedStateFromError: any = undefined;

  mountReactDevToolsOverlays(): void {
    const DevtoolsOverlay = require('../Inspector/DevtoolsOverlay').default;
    const devtoolsOverlay = <DevtoolsOverlay inspectedView={this._mainRef} />;

    const TraceUpdateOverlay =
      require('../Components/TraceUpdateOverlay/TraceUpdateOverlay').default;
    const traceUpdateOverlay = <TraceUpdateOverlay />;

    this.setState({devtoolsOverlay, traceUpdateOverlay});
  }

  componentDidMount(): void {
    if (__DEV__) {
      if (!this.props.internal_excludeInspector) {
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

        if (reactDevToolsHook != null) {
          if (reactDevToolsHook.reactDevtoolsAgent) {
            // In case if this is not the first AppContainer rendered and React DevTools are already attached
            this.mountReactDevToolsOverlays();
            return;
          }

          this._reactDevToolsAgentListener = () =>
            this.mountReactDevToolsOverlays();

          reactDevToolsHook.on(
            'react-devtools',
            this._reactDevToolsAgentListener,
          );
        }
      }
    }
  }

  componentWillUnmount(): void {
    if (this._subscription != null) {
      this._subscription.remove();
    }

    if (reactDevToolsHook != null && this._reactDevToolsAgentListener != null) {
      reactDevToolsHook.off('react-devtools', this._reactDevToolsAgentListener);
    }
  }

  render(): React.Node {
    let logBox = null;
    if (__DEV__) {
      if (!this.props.internal_excludeLogBox) {
        const LogBoxNotificationContainer =
          require('../LogBox/LogBoxNotificationContainer').default;
        logBox = <LogBoxNotificationContainer />;
      }
    }

    let innerView: React.Node = (
      <View
        collapsable={!this.state.inspector && !this.state.devtoolsOverlay}
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
          initialProps={this.props.initialProps}
          fabric={this.props.fabric === true}
          showArchitectureIndicator={
            this.props.showArchitectureIndicator === true
          }>
          {innerView}
        </Wrapper>
      );
    }

    return (
      <RootTagContext.Provider value={createRootTag(this.props.rootTag)}>
        <View style={styles.appContainer} pointerEvents="box-none">
          {innerView}
          {this.state.traceUpdateOverlay}
          {this.state.devtoolsOverlay}
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

module.exports = AppContainer;
