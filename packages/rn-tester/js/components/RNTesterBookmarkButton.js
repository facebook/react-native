/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const React = require('react');

import {TouchableOpacity, Image, StyleSheet} from 'react-native';

type Props = {|
  isActive: boolean,
  onPress: Function,
  size: number,
|};

class RNTesterBookmarkButton extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render(): React.Node {
    const {size, onPress, isActive} = this.props;
    return (
      <TouchableOpacity
        style={[
          styles.imageViewStyle,
          {
            height: size + 5,
            width: size + 5,
            borderRadius: Math.floor(size + 5 / 2),
          },
        ]}
        onPress={onPress}>
        <Image
          style={{height: size, width: size}}
          source={
            isActive
              ? require('../assets/bookmark-filled.png')
              : require('../assets/bookmark-outline-gray.png')
          }
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  imageViewStyle: {
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

module.exports = RNTesterBookmarkButton;
