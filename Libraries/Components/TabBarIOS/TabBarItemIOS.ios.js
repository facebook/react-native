/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const React = require('React');
const StaticContainer = require('StaticContainer.react');
const StyleSheet = require('StyleSheet');
const View = require('View');

const requireNativeComponent = require('requireNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {ColorValue} from 'StyleSheetTypes';
import type {SyntheticEvent} from 'CoreEventTypes';
import type {ImageSource} from 'ImageSource';

type Props = $ReadOnly<{|
  ...ViewProps,

  /**
   * Little red bubble that sits at the top right of the icon.
   */
  badge?: ?(string | number),

  /**
   * Background color for the badge. Available since iOS 10.
   */
  badgeColor?: ColorValue,

  /**
   * Items comes with a few predefined system icons. Note that if you are
   * using them, the title and selectedIcon will be overridden with the
   * system ones.
   */
  systemIcon?: ?(
    | 'bookmarks'
    | 'contacts'
    | 'downloads'
    | 'favorites'
    | 'featured'
    | 'history'
    | 'more'
    | 'most-recent'
    | 'most-viewed'
    | 'recents'
    | 'search'
    | 'top-rated'
  ),

  /**
   * A custom icon for the tab. It is ignored when a system icon is defined.
   */
  icon?: ?ImageSource,

  /**
   * A custom icon when the tab is selected. It is ignored when a system
   * icon is defined. If left empty, the icon will be tinted in blue.
   */
  selectedIcon?: ?ImageSource,

  /**
   * Callback when this tab is being selected, you should change the state of your
   * component to set selected={true}.
   */
  onPress?: ?(event: SyntheticEvent<null>) => mixed,

  /**
   * If set to true it renders the image as original,
   * it defaults to being displayed as a template
   */
  renderAsOriginal?: ?boolean,

  /**
   * It specifies whether the children are visible or not. If you see a
   * blank content, you probably forgot to add a selected one.
   */
  selected?: ?boolean,

  /**
   * Text that appears under the icon. It is ignored when a system icon
   * is defined.
   */
  title?: ?string,

  /**
   * *(Apple TV only)* When set to true, this view will be focusable
   * and navigable using the Apple TV remote.
   *
   * @platform ios
   */
  isTVSelectable?: ?boolean,
|}>;

type State = {|
  hasBeenSelected: boolean,
|};

let showedDeprecationWarning = false;

class TabBarItemIOS extends React.Component<Props, State> {
  state = {
    hasBeenSelected: false,
  };

  UNSAFE_componentWillMount() {
    if (this.props.selected) {
      this.setState({hasBeenSelected: true});
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (this.state.hasBeenSelected || nextProps.selected) {
      this.setState({hasBeenSelected: true});
    }
  }

  componentDidMount() {
    if (!showedDeprecationWarning) {
      console.warn(
        'TabBarIOS and TabBarItemIOS are deprecated and will be removed in a future release. ' +
          'Please use react-native-tab-view instead.',
      );

      showedDeprecationWarning = true;
    }
  }

  render() {
    const {style, children, ...props} = this.props;

    // if the tab has already been shown once, always continue to show it so we
    // preserve state between tab transitions
    let tabContents;
    if (this.state.hasBeenSelected) {
      tabContents = (
        <StaticContainer shouldUpdate={this.props.selected}>
          {children}
        </StaticContainer>
      );
    } else {
      tabContents = <View />;
    }

    return (
      <RCTTabBarItem {...props} style={[styles.tab, style]}>
        {tabContents}
      </RCTTabBarItem>
    );
  }
}

const styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});

const RCTTabBarItem = requireNativeComponent('RCTTabBarItem');

module.exports = TabBarItemIOS;
