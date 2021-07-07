/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
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

function MovingBoxExample(props: Props): React.Node {
  const x = React.useRef(new Animated.Value(0));
  const [boxVisible, setBoxVisible] = React.useState(true);

  const moveTo = (pos: number) => {
    Animated.timing(x.current, {
      toValue: pos,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const toggleVisibility = () => {
    setBoxVisible(!boxVisible);
  };
  const toggleText = boxVisible ? 'Hide' : 'Show';
  const onReset = () => {
    x.current.resetAnimation();
  };

  return (
    <View style={styles.container}>
      {boxVisible ? (
        <View style={styles.boxContainer}>
          <Animated.View
            testID="moving-view"
            style={[
              styles.content,
              styles.box,
              {transform: [{translateX: x.current}]},
            ]}
          />
        </View>
      ) : (
        <View style={styles.boxContainer}>
          <Text>The box view is not being rendered</Text>
        </View>
      )}
      <View style={styles.buttonsContainer}>
        <RNTesterButton testID="move-left-button" onPress={() => moveTo(0)}>
          {'<-'}
        </RNTesterButton>
        <RNTesterButton onPress={toggleVisibility}>{toggleText}</RNTesterButton>
        <RNTesterButton onPress={onReset}>Reset</RNTesterButton>
        <RNTesterButton
          testID="move-right-button"
          onPress={() => moveTo(containerWidth - boxSize)}>
          {'->'}
        </RNTesterButton>
      </View>
    </View>
  );
}

export default ({
  title: 'Moving box example',
  name: 'movingView',
  description:
    'Click arrow buttons to move the box. Then hide the box and reveal it again. The box will stay its last position. Reset will reset the animation to its starting position',
  render: (): React.Node => <MovingBoxExample />,
}: RNTesterModuleExample);
