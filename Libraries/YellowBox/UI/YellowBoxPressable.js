/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const TouchableWithoutFeedback = require('../../Components/Touchable/TouchableWithoutFeedback');
const View = require('../../Components/View/View');
const YellowBoxStyle = require('./YellowBoxStyle');

import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {PressEvent} from '../../Types/CoreEventTypes';

type Props = $ReadOnly<{|
  backgroundColor: $ReadOnly<{|
    default: string,
    pressed: string,
  |}>,
  children?: React.Node,
  hitSlop?: ?EdgeInsetsProp,
  onPress?: ?(event: PressEvent) => void,
  style?: ViewStyleProp,
|}>;

type State = {|
  pressed: boolean,
|};

class YellowBoxPressable extends React.Component<Props, State> {
  static defaultProps: $TEMPORARY$object<{|
    backgroundColor: $TEMPORARY$object<{|default: string, pressed: string|}>,
  |}> = {
    backgroundColor: {
      default: YellowBoxStyle.getBackgroundColor(0.95),
      pressed: YellowBoxStyle.getHighlightColor(1),
    },
  };

  state: State = {
    pressed: false,
  };

  render(): React.Node {
    const content = (
      <View
        style={StyleSheet.compose(
          {
            backgroundColor: this.state.pressed
              ? this.props.backgroundColor.pressed
              : this.props.backgroundColor.default,
          },
          this.props.style,
        )}>
        {this.props.children}
      </View>
    );
    return this.props.onPress == null ? (
      content
    ) : (
      <TouchableWithoutFeedback
        hitSlop={this.props.hitSlop}
        onPress={this.props.onPress}
        onPressIn={this._handlePressIn}
        onPressOut={this._handlePressOut}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  _handlePressIn = () => {
    this.setState({pressed: true});
  };

  _handlePressOut = () => {
    this.setState({pressed: false});
  };
}

module.exports = YellowBoxPressable;
