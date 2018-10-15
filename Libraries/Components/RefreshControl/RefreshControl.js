/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Platform = require('Platform');
const React = require('React');
const {NativeComponent} = require('ReactNative');

const requireNativeComponent = require('requireNativeComponent');
const nullthrows = require('fbjs/lib/nullthrows');

import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';

if (Platform.OS === 'android') {
  const AndroidSwipeRefreshLayout = require('UIManager')
    .AndroidSwipeRefreshLayout;
  var RefreshLayoutConsts = AndroidSwipeRefreshLayout
    ? AndroidSwipeRefreshLayout.Constants
    : {SIZE: {}};
} else {
  var RefreshLayoutConsts = {SIZE: {}};
}
type NativeRefreshControlType = Class<NativeComponent<RefreshControlProps>>;

const NativeRefreshControl: NativeRefreshControlType =
  Platform.OS === 'ios'
    ? (requireNativeComponent('RCTRefreshControl'): any)
    : (requireNativeComponent('AndroidSwipeRefreshLayout'): any);

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
   * Size of the refresh indicator, see RefreshControl.SIZE.
   */
  size?: ?(
    | typeof RefreshLayoutConsts.SIZE.DEFAULT
    | typeof RefreshLayoutConsts.SIZE.LARGE
  ),
  /**
   * Progress view top offset
   */
  progressViewOffset?: ?number,
|}>;

export type RefreshControlProps = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,
  ...AndroidProps,

  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?Function,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,
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
 */
class RefreshControl extends React.Component<RefreshControlProps> {
  static SIZE = RefreshLayoutConsts.SIZE;

  _nativeRef: ?React.ElementRef<NativeRefreshControlType> = null;
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
    } else if (this.props.refreshing !== this._lastNativeRefreshing) {
      nullthrows(this._nativeRef).setNativeProps({
        refreshing: this.props.refreshing,
      });
      this._lastNativeRefreshing = this.props.refreshing;
    }
  }

  render() {
    return (
      <NativeRefreshControl
        {...this.props}
        ref={ref => {
          this._nativeRef = ref;
        }}
        onRefresh={this._onRefresh}
      />
    );
  }

  _onRefresh = () => {
    this._lastNativeRefreshing = true;

    this.props.onRefresh && this.props.onRefresh();

    // The native component will start refreshing so force an update to
    // make sure it stays in sync with the js component.
    this.forceUpdate();
  };
}

module.exports = RefreshControl;
