/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ViewProps} from '../View/ViewPropTypes';

import AndroidSwipeRefreshLayoutNativeComponent, {
  Commands as AndroidSwipeRefreshLayoutCommands,
} from './AndroidSwipeRefreshLayoutNativeComponent';
import PullToRefreshViewNativeComponent, {
  Commands as PullToRefreshCommands,
} from './PullToRefreshViewNativeComponent';

const Platform = require('../../Utilities/Platform');
const React = require('react');
const {useEffect, useRef} = React;

/**
 * Type definitions for iOS-specific properties
 */
type IOSProps = $ReadOnly<{|
  /**
   * The color of the refresh indicator.
   */
  tintColor?: ?ColorValue,
  /**
   * Title color.
   */
  titleColor?: ?ColorValue,
  /**
   * The title displayed under the refresh indicator.
   */
  title?: ?string,
|}>;

/**
 * Type definitions for Android-specific properties
 */
type AndroidProps = $ReadOnly<{|
  /**
   * Whether the pull to refresh functionality is enabled.
   */
  enabled?: ?boolean,
  /**
   * The colors (at least one) that will be used to draw the refresh indicator.
   */
  colors?: ?$ReadOnlyArray<ColorValue>,
  /**
   * The background color of the refresh indicator.
   */
  progressBackgroundColor?: ?ColorValue,
  /**
   * Size of the refresh indicator.
   */
  size?: ?('default' | 'large'),
|}>;

/**
 * The main RefreshControlProps type definition
 */
export type RefreshControlProps = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,
  ...AndroidProps,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?() => void | Promise<void>,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,

  /**
   * Progress view top offset
   */
  progressViewOffset?: ?number,
|}>;

/**
 * This component is used inside a ScrollView or ListView to add pull to refresh
 * functionality. When the ScrollView is at `scrollY: 0`, swiping down
 * triggers an `onRefresh` event.
 *
 * ### Usage example
 *
 * ``` js
 * class RefreshableList extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       refreshing: false,
 *     };
 *   }
 *
 *   _onRefresh() {
 *     this.setState({refreshing: true});
 *     fetchData().then(() => {
 *       this.setState({refreshing: false});
 *     });
 *   }
 *
 *   render() {
 *     return (
 *       <ListView
 *         refreshControl={
 *           <RefreshControl
 *             refreshing={this.state.refreshing}
 *             onRefresh={this._onRefresh.bind(this)}
 *           />
 *         }
 *         ...
 *       >
 *       ...
 *       </ListView>
 *     );
 *   }
 *   ...
 * }
 * ```
 *
 * __Note:__ `refreshing` is a controlled prop, this is why it needs to be set to true
 * in the `onRefresh` function otherwise the refresh indicator will stop immediately.
 * RefreshControl Component
 */
class RefreshControl extends React.Component<RefreshControlProps> {
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
      const {enabled, colors, progressBackgroundColor, size, ...props} =
        this.props;
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
          onTouchStart={this._handleTouchStart}
          onTouchMove={this._handleTouchMove}
        />
      );
    }
  }

  _onRefresh = () => {
    this._lastNativeRefreshing = true;

    // $FlowFixMe[unused-promise]
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

  /**
   * Horizontal Gesture Handling for Android
   */
  _handleTouchStart = (event) => {
    if (Platform.OS === 'android' && event.nativeEvent.touches.length === 1) {
      this._nativeRef?.prevTouchX = event.nativeEvent.touches[0].pageX;
    }
  };

  _handleTouchMove = (event) => {
    if (Platform.OS === 'android' && event.nativeEvent.touches.length === 1) {
      const touchX = event.nativeEvent.touches[0].pageX;
      const prevTouchX = this._nativeRef?.prevTouchX || 0;
      const xDiff = Math.abs(touchX - prevTouchX);

      if (xDiff > 5 && this._nativeRef) {
        AndroidSwipeRefreshLayoutCommands.cancelRefreshGesture(
          this._nativeRef,
        );
      }
    }
  };
}

module.exports = RefreshControl;
