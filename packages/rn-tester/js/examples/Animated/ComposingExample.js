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
import type {CompositeAnimation} from 'react-native/Libraries/Animated/AnimatedMock';
import * as React from 'react';
import RNTesterButton from '../../components/RNTesterButton';
import {Text, StyleSheet, View, Animated, FlatList} from 'react-native';

type Props = $ReadOnly<{||}>;

const leftToRightTimingConfig = {
  toValue: 200,
  useNativeDriver: true,
};
const rightToLeftTimingConfig = {
  toValue: 0,
  useNativeDriver: true,
};
const items = [
  {
    title: 'Parallel',
    compositeAnimation: values =>
      Animated.sequence([
        Animated.parallel(
          values.map(value => Animated.timing(value, leftToRightTimingConfig)),
        ),
        Animated.parallel(
          values.map(value => Animated.timing(value, rightToLeftTimingConfig)),
        ),
      ]),
  },
  {
    title: 'Sequence',
    compositeAnimation: values =>
      Animated.sequence([
        Animated.sequence(
          values.map(value => Animated.timing(value, leftToRightTimingConfig)),
        ),
        Animated.sequence(
          values.map(value => Animated.timing(value, rightToLeftTimingConfig)),
        ),
      ]),
  },
  {
    title: 'Stagger',
    compositeAnimation: values =>
      Animated.sequence([
        Animated.stagger(
          150,
          values.map(value => Animated.timing(value, leftToRightTimingConfig)),
        ),
        Animated.stagger(
          150,
          values.map(value => Animated.timing(value, rightToLeftTimingConfig)),
        ),
      ]),
  },
  {
    title: 'Delay',
    compositeAnimation: values =>
      Animated.sequence([
        Animated.delay(2000),
        Animated.parallel(
          values.map(value => Animated.timing(value, leftToRightTimingConfig)),
        ),
        Animated.delay(2000),
        Animated.parallel(
          values.map(value => Animated.timing(value, rightToLeftTimingConfig)),
        ),
      ]),
  },
];

function ComposingExampleItem({
  title,
  compositeAnimation,
}: {
  title: string,
  compositeAnimation: (values: Animated.Value[]) => CompositeAnimation,
}): React.Node {
  const boxes = [0, 1, 2, 3, 4];
  const xTranslations = React.useRef(boxes.map(() => new Animated.Value(0)))
    .current;

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemMeta}>
        <Text style={styles.itemTitle}>{title}</Text>
        <RNTesterButton
          onPress={() => {
            compositeAnimation(xTranslations).start();
          }}>
          Animate
        </RNTesterButton>
      </View>
      <View>
        {boxes.map(box => (
          <Animated.View
            key={box}
            style={[
              styles.box,
              {
                transform: [{translateX: xTranslations[box]}],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function ComposingExample(props: Props): React.Node {
  return (
    <FlatList
      data={items}
      renderItem={({item}) => (
        <ComposingExampleItem
          key={item.title}
          title={item.title}
          compositeAnimation={item.compositeAnimation}
        />
      )}
    />
  );
}

const boxSize = 12;
const styles = StyleSheet.create({
  itemContainer: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemMeta: {
    alignItems: 'flex-start',
    paddingRight: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '300',
  },
  box: {
    borderRadius: 1,
    backgroundColor: '#61dafb',
    width: boxSize,
    height: boxSize,
    marginBottom: 2,
  },
});

export default ({
  title: 'Composing',
  name: 'composing',
  description: 'Combine multiple animations using composition functions',
  render: () => <ComposingExample />,
}: RNTesterModuleExample);
