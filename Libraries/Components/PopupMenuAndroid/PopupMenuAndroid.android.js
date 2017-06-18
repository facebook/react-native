/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule PopupMenuAndroid
 */
'use strict';

const React = require('react');
const ReactNative = require('ReactNative');
const PropTypes = require('prop-types');
const UIManager = require('UIManager');

type Props = {
  children?: any,
  items: Array<{ value: string }>,
  onItemSelect: ({ index: number, value: string }) => void,
  onDismiss: Function,
  onError: Function,
}

/**
 * React component to show a PopupMenu on Android.
 *
 * Example:
 *
 * ```
 * <PopupMenuAndroid
 *   items={[
 *     { value: 'Apples' },
 *     { value: 'Oranges' }
 *   ]}
 *   onItemSelect={({ value, index }) => console.log(`Selected ${value} at ${index}`)}
 *   onDismiss={() => console.log(`Dismissed`)}
 * >
 *   <Text>Press me</Text>
 * </PopupMenuAndroid>
 * ```
 *
 * If the child accepts an `onPress` prop, showing the menu is automatically handled.
 *
 * You can also use a ref to show the menu:
 *
 * ```
 * <PopupMenuAndroid
 *   ref={c => this._menu = c}
 *   items={[
 *     { value: 'Apples' },
 *     { value: 'Oranges' }
 *   ]}
 *   onItemSelect={({ value, index }) => console.log(`Selected ${value} at ${index}`)}
 *   onDismiss={() => console.log(`Dismissed`)}
 * >
 *   <Text onPress={() => this._menu.show()}>Press me</Text>
 * </PopupMenuAndroid>
 * ```
 */
class PopupMenuAndroid extends React.Component<void, Props, void> {
  static propTypes = {
    children: PropTypes.element.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string })).isRequired,
    onItemSelect: PropTypes.func.isRequired,
    onDismiss: PropTypes.func,
    onError: PropTypes.func,
  };

  show() {
    UIManager.showPopupMenu(
      ReactNative.findNodeHandle(this._anchor),
      this.props.items.map(({ value }) => value),
      this.props.onError,
      this._handleClose
    );
  }

  _handleClose = (action, index) => {
    switch (action) {
      case 'itemSelected': {
        const { value } = this.props.items[index];
        this.props.onItemSelect({ index, value });
        break;
      }
      case 'dismissed': {
        if (this.props.onDismiss) {
          this.props.onDismiss();
        }
        break;
      }
    }
  };

  _handleAnchorPress = e => {
    const child = React.Children.only(this.props.children);

    if (child.props.onPress) {
      child.props.onPress(e);
    } else {
      this.show();
    }
  };

  _anchor: any;

  _setRef = c => (this._anchor = c);

  render() {
    return React.cloneElement(React.Children.only(this.props.children), {
      ref: this._setRef,
      onPress: this._handleAnchorPress,
      collapsable: false, // prevent android views from collapsing
    });
  }
}

module.exports = PopupMenuAndroid;
