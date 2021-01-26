/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @generate-docs
 */

'use strict';

const Platform = require('../../Utilities/Platform');
const React = require('react');

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ViewProps} from '../View/ViewPropTypes';
import AndroidSwipeRefreshLayoutNativeComponent, {
  Commands as AndroidSwipeRefreshLayoutCommands,
} from './AndroidSwipeRefreshLayoutNativeComponent';
import PullToRefreshViewNativeComponent, {
  Commands as PullToRefreshCommands,
} from './PullToRefreshViewNativeComponent';

let RefreshLayoutConsts: any;
if (Platform.OS === 'android') {
  const AndroidSwipeRefreshLayout = require('../../ReactNative/UIManager').getViewManagerConfig(
    'AndroidSwipeRefreshLayout',
  );
  RefreshLayoutConsts = AndroidSwipeRefreshLayout
    ? AndroidSwipeRefreshLayout.Constants
    : {SIZE: {}};
} else {
  RefreshLayoutConsts = {SIZE: {}};
}

type IOSProps = $ReadOnly<{|
  /**
    The color of the refresh indicator.

    @platform ios
   */
  tintColor?: ?ColorValue,
  /**
    The color of the refresh indicator title.

    @platform ios
   */
  titleColor?: ?ColorValue,
  /**
    The title displayed under the refresh indicator.

    @platform ios
   */
  title?: ?string,
|}>;

type AndroidProps = $ReadOnly<{|
  /**
    Whether the pull to refresh functionality is enabled.

    @platform android

    @default true
   */
  enabled?: ?boolean,
  /**
    The colors (at least one) that will be used to draw the refresh indicator.

    @platform android
   */
  colors?: ?$ReadOnlyArray<ColorValue>,
  /**
    The background color of the refresh indicator.

    @platform android
   */
  progressBackgroundColor?: ?ColorValue,
  /**
    Size of the refresh indicator.

    @platform android

    @default RefreshLayoutConsts.SIZE.DEFAULT
   */
  size?: ?(
    | typeof RefreshLayoutConsts.SIZE.DEFAULT
    | typeof RefreshLayoutConsts.SIZE.LARGE
  ),
  /**
    Progress view top offset

    @platform android

    @default 0
   */
  progressViewOffset?: ?number,
|}>;

export type RefreshControlProps = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,
  ...AndroidProps,

  /**
    Called when the view starts refreshing.
   */
  onRefresh?: ?() => void | Promise<void>,

  /**
    Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
|}>;

/**
  This component is used inside a ScrollView or ListView to add pull to refresh
  functionality. When the ScrollView is at `scrollY: 0`, swiping down
  triggers an `onRefresh` event.

  ```SnackPlayer name=RefreshControl&supportedPlatforms=ios,android
  import React from 'react';
  import {
    ScrollView,
    RefreshControl,
    StyleSheet,
    Text,
    SafeAreaView,
  } from 'react-native';
  import Constants from 'expo-constants';

  const wait = (timeout) => {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

  const App = () => {
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = React.useCallback(() => {
      setRefreshing(true);

      wait(2000).then(() => setRefreshing(false));
    }, []);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text>Pull down to see RefreshControl indicator</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: Constants.statusBarHeight,
    },
    scrollView: {
      flex: 1,
      backgroundColor: 'pink',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  export default App;
  ```

  > Note: `refreshing` is a controlled prop, this is why it needs to be set to
  true in the `onRefresh` function otherwise the refresh indicator will stop immediately.
 */
class RefreshControl extends React.Component<RefreshControlProps> {
  static SIZE: any = RefreshLayoutConsts.SIZE;

  _nativeRef: ?React.ElementRef<
    | typeof PullToRefreshViewNativeComponent
    | typeof AndroidSwipeRefreshLayoutNativeComponent,
  >;
  _lastNativeRefreshing = false;

  componentDidMount() {
    this._lastNativeRefreshing = this.props.refreshing;
  }

  componentDidUpdate(prevProps: RefreshControlProps) {
    // RefreshControl is a controlled component so if the native refreshing
    // value doesn't match the current js refreshing prop update it to
    // the js value.
    if (this.props.refreshing !== prevProps.refreshing) {
      this._lastNativeRefreshing = this.props.refreshing;
    } else if (
      this.props.refreshing !== this._lastNativeRefreshing &&
      this._nativeRef
    ) {
      if (Platform.OS === 'android') {
        AndroidSwipeRefreshLayoutCommands.setNativeRefreshing(
          this._nativeRef,
          this.props.refreshing,
        );
      } else {
        PullToRefreshCommands.setNativeRefreshing(
          this._nativeRef,
          this.props.refreshing,
        );
      }
      this._lastNativeRefreshing = this.props.refreshing;
    }
  }

  render(): React.Node {
    if (Platform.OS === 'ios') {
      const {
        enabled,
        colors,
        progressBackgroundColor,
        size,
        progressViewOffset,
        ...props
      } = this.props;
      return (
        <PullToRefreshViewNativeComponent
          {...props}
          ref={this._setNativeRef}
          onRefresh={this._onRefresh}
        />
      );
    } else {
      const {tintColor, titleColor, title, ...props} = this.props;
      return (
        <AndroidSwipeRefreshLayoutNativeComponent
          {...props}
          ref={this._setNativeRef}
          onRefresh={this._onRefresh}
        />
      );
    }
  }

  _onRefresh = () => {
    this._lastNativeRefreshing = true;

    this.props.onRefresh && this.props.onRefresh();

    // The native component will start refreshing so force an update to
    // make sure it stays in sync with the js component.
    this.forceUpdate();
  };

  _setNativeRef = (
    ref: ?React.ElementRef<
      | typeof PullToRefreshViewNativeComponent
      | typeof AndroidSwipeRefreshLayoutNativeComponent,
    >,
  ) => {
    this._nativeRef = ref;
  };
}

module.exports = RefreshControl;
