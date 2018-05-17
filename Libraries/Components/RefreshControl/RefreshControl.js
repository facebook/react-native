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

const ColorPropType = require('ColorPropType');
const NativeMethodsMixin = require('NativeMethodsMixin');
const Platform = require('Platform');
const React = require('React');
const ReactNative = require('ReactNative');
const PropTypes = require('prop-types');
const ViewPropTypes = require('ViewPropTypes');

const createReactClass = require('create-react-class');
const requireNativeComponent = require('requireNativeComponent');

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

type IOSProps = $ReadOnly<{|
  tintColor?: ?ColorValue,
  titleColor?: ?ColorValue,
  title?: ?string,
|}>;

type AndroidProps = $ReadOnly<{|
  enabled?: ?boolean,
  colors?: ?$ReadOnlyArray<ColorValue>,
  progressBackgroundColor?: ?ColorValue,
  size?: ?(
    | typeof RefreshLayoutConsts.SIZE.DEFAULT
    | typeof RefreshLayoutConsts.SIZE.LARGE
  ),
  progressViewOffset?: ?number,
|}>;

type Props = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,
  ...AndroidProps,
  onRefresh?: ?Function,
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
const RefreshControl = createReactClass({
  displayName: 'RefreshControl',
  statics: {
    SIZE: RefreshLayoutConsts.SIZE,
  },

  mixins: [NativeMethodsMixin],

  propTypes: {
    ...ViewPropTypes,
    /**
     * Called when the view starts refreshing.
     */
    onRefresh: PropTypes.func,
    /**
     * Whether the view should be indicating an active refresh.
     */
    refreshing: PropTypes.bool.isRequired,
    /**
     * The color of the refresh indicator.
     * @platform ios
     */
    tintColor: ColorPropType,
    /**
     * Title color.
     * @platform ios
     */
    titleColor: ColorPropType,
    /**
     * The title displayed under the refresh indicator.
     * @platform ios
     */
    title: PropTypes.string,
    /**
     * Whether the pull to refresh functionality is enabled.
     * @platform android
     */
    enabled: PropTypes.bool,
    /**
     * The colors (at least one) that will be used to draw the refresh indicator.
     * @platform android
     */
    colors: PropTypes.arrayOf(ColorPropType),
    /**
     * The background color of the refresh indicator.
     * @platform android
     */
    progressBackgroundColor: ColorPropType,
    /**
     * Size of the refresh indicator, see RefreshControl.SIZE.
     * @platform android
     */
    size: PropTypes.oneOf([
      RefreshLayoutConsts.SIZE.DEFAULT,
      RefreshLayoutConsts.SIZE.LARGE,
    ]),
    /**
     * Progress view top offset
     * @platform android
     */
    progressViewOffset: PropTypes.number,
  },

  _nativeRef: (null: any),
  _lastNativeRefreshing: false,

  componentDidMount() {
    this._lastNativeRefreshing = this.props.refreshing;
  },

  componentDidUpdate(prevProps: {refreshing: boolean}) {
    // RefreshControl is a controlled component so if the native refreshing
    // value doesn't match the current js refreshing prop update it to
    // the js value.
    if (this.props.refreshing !== prevProps.refreshing) {
      this._lastNativeRefreshing = this.props.refreshing;
    } else if (this.props.refreshing !== this._lastNativeRefreshing) {
      this._nativeRef.setNativeProps({refreshing: this.props.refreshing});
      this._lastNativeRefreshing = this.props.refreshing;
    }
  },

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
  },

  _onRefresh() {
    this._lastNativeRefreshing = true;

    this.props.onRefresh && this.props.onRefresh();

    // The native component will start refreshing so force an update to
    // make sure it stays in sync with the js component.
    this.forceUpdate();
  },
});

class TypedRefreshControl extends ReactNative.NativeComponent<Props> {
  static SIZE = RefreshLayoutConsts.SIZE;
}

if (Platform.OS === 'ios') {
  var NativeRefreshControl = requireNativeComponent(
    'RCTRefreshControl',
    RefreshControl,
  );
} else if (Platform.OS === 'android') {
  var NativeRefreshControl = requireNativeComponent(
    'AndroidSwipeRefreshLayout',
    RefreshControl,
  );
}

module.exports = ((RefreshControl: any): Class<TypedRefreshControl>);
