/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterExampleModuleItem} from '../../types/RNTesterTypes';
import * as React from 'react';
import RNTesterButton from '../../components/RNTesterButton';
import {Text, StyleSheet, View, Animated} from 'react-native';
const containerWidth = 200;
const boxSize = 50;

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
  },
  boxContainer: {
    backgroundColor: '#d3d3d3',
    height: boxSize,
    width: containerWidth,
  },
  box: {
    width: boxSize,
    height: boxSize,
    margin: 0,
  },
  buttonsContainer: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: containerWidth,
  },
});

type Props = $ReadOnly<{||}>;
type State = {|boxVisible: boolean|};

class MovingBoxExample extends React.Component<Props, State> {
  x: Animated.Value;
  constructor(props) {
    super(props);
    this.x = new Animated.Value(0);
    this.state = {
      boxVisible: true,
    };
  }

  render() {
    const {boxVisible} = this.state;
    const toggleText = boxVisible ? 'Hide' : 'Show';
    return (
      <View style={styles.container}>
        {this.renderBox()}
        <View style={styles.buttonsContainer}>
          <RNTesterButton
            testID="move-left-button"
            onPress={() => this.moveTo(0)}>
            {'<-'}
          </RNTesterButton>
          <RNTesterButton onPress={this.toggleVisibility}>
            {toggleText}
          </RNTesterButton>
          <RNTesterButton
            testID="move-right-button"
            onPress={() => this.moveTo(containerWidth - boxSize)}>
            {'->'}
          </RNTesterButton>
        </View>
      </View>
    );
  }

  renderBox = () => {
    if (this.state.boxVisible) {
      const horizontalLocation = {transform: [{translateX: this.x}]};
      return (
        <View style={styles.boxContainer}>
          <Animated.View
            testID="moving-view"
            style={[styles.content, styles.box, horizontalLocation]}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.boxContainer}>
          <Text>The box view is not being rendered</Text>
        </View>
      );
    }
  };

  moveTo = x => {
    Animated.timing(this.x, {
      toValue: x,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  toggleVisibility = () => {
    const {boxVisible} = this.state;
    this.setState({boxVisible: !boxVisible});
  };
}

export default ({
  title: 'Moving box example',
  name: 'movingView',
  description: ('Click arrow buttons to move the box.' +
    'Then hide the box and reveal it again.' +
    'After that the box position will reset to initial position.': string),
  render: (): React.Node => <MovingBoxExample />,
}: RNTesterExampleModuleItem);
