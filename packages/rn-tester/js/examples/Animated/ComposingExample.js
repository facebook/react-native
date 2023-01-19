/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {CompositeAnimation} from 'react-native/Libraries/Animated/AnimatedMock';
import type AnimatedValue from 'react-native/Libraries/Animated/nodes/AnimatedValue';
import * as React from 'react';
import RNTesterButton from '../../components/RNTesterButton';
import ToggleNativeDriver from './utils/ToggleNativeDriver';
import RNTConfigurationBlock from '../../components/RNTConfigurationBlock';
import {
  Text,
  StyleSheet,
  View,
  Animated,
  FlatList,
  useWindowDimensions,
} from 'react-native';

type Props = $ReadOnly<{||}>;
const boxSize = 12;
const padding = 8;
const leftToRightTimingConfig = (useNativeDriver: boolean) => ({
  toValue: 1,
  useNativeDriver,
});
const rightToLeftTimingConfig = (useNativeDriver: boolean) => ({
  toValue: 0,
  useNativeDriver,
});

const items = [
  {
    title: 'Parallel',
    description: 'Starts a number of animations at the same time',
    compositeAnimation: (
      values: Array<AnimatedValue>,
      useNativeDriver: boolean,
    ) =>
      Animated.sequence([
        Animated.parallel(
          values.map(value =>
            Animated.timing(value, leftToRightTimingConfig(useNativeDriver)),
          ),
        ),
        Animated.parallel(
          values.map(value =>
            Animated.timing(value, rightToLeftTimingConfig(useNativeDriver)),
          ),
        ),
      ]),
  },
  {
    title: 'Sequence',
    description:
      'Starts the animations in order, waiting for each to complete before starting the next',
    compositeAnimation: (
      values: Array<AnimatedValue>,
      useNativeDriver: boolean,
    ) =>
      Animated.sequence([
        Animated.sequence(
          values.map(value =>
            Animated.timing(value, leftToRightTimingConfig(useNativeDriver)),
          ),
        ),
        Animated.sequence(
          values.map(value =>
            Animated.timing(value, rightToLeftTimingConfig(useNativeDriver)),
          ),
        ),
      ]),
  },
  {
    title: 'Stagger',
    description:
      'Starts animations in order and in parallel, but with successive delays',
    compositeAnimation: (
      values: Array<AnimatedValue>,
      useNativeDriver: boolean,
    ) =>
      Animated.sequence([
        Animated.stagger(
          150,
          values.map(value =>
            Animated.timing(value, leftToRightTimingConfig(useNativeDriver)),
          ),
        ),
        Animated.stagger(
          150,
          values.map(value =>
            Animated.timing(value, rightToLeftTimingConfig(useNativeDriver)),
          ),
        ),
      ]),
  },
  {
    title: 'Delay',
    description: 'Starts an animation after a given delay',
    compositeAnimation: (
      values: Array<AnimatedValue>,
      useNativeDriver: boolean,
    ) =>
      Animated.sequence([
        Animated.delay(2000),
        Animated.parallel(
          values.map(value =>
            Animated.timing(value, leftToRightTimingConfig(useNativeDriver)),
          ),
        ),
        Animated.delay(2000),
        Animated.parallel(
          values.map(value =>
            Animated.timing(value, rightToLeftTimingConfig(useNativeDriver)),
          ),
        ),
      ]),
  },
];

function ComposingExampleItem({
  title,
  description,
  compositeAnimation,
  useNativeDriver,
}: {
  title: string,
  description: string,
  compositeAnimation: (
    values: Animated.Value[],
    useNativeDriver: boolean,
  ) => CompositeAnimation,
  useNativeDriver: boolean,
}): React.Node {
  const {width: windowWidth} = useWindowDimensions();

  // Figure out how far along the x axis we should translate the box by taking into
  // account the window width, box size, and padding
  const maxXTranslation = windowWidth - boxSize - 4 * padding;
  const boxIndexes = React.useMemo(() => [0, 1, 2, 3, 4], []);
  const xTranslations = React.useRef(
    boxIndexes.map(() => new Animated.Value(0)),
  );
  const animation = React.useRef(
    compositeAnimation(xTranslations.current, useNativeDriver),
  );

  return (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text>{description}</Text>
      <View style={styles.boxesContainer}>
        {boxIndexes.map(boxIndex => {
          const translateX = xTranslations.current[boxIndex].interpolate({
            inputRange: [0, 1],
            outputRange: [0, maxXTranslation],
          });

          return (
            <Animated.View
              key={boxIndex}
              style={[
                styles.box,
                {
                  transform: [{translateX}],
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.buttonsContainer}>
        <RNTesterButton
          onPress={() => {
            animation.current.reset();
            animation.current.start();
          }}>
          Start
        </RNTesterButton>
        <RNTesterButton
          onPress={() => {
            animation.current.stop();
          }}>
          Stop
        </RNTesterButton>
        <RNTesterButton
          onPress={() => {
            // TODO (T96213225): Animated.reset() doesn't work without using native driver
            animation.current.reset();
          }}>
          Reset
        </RNTesterButton>
      </View>
    </View>
  );
}

function ComposingExample(props: Props): React.Node {
  const [useNativeDriver, setUseNativeDriver] = React.useState(false);

  return (
    <>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
        />
      </RNTConfigurationBlock>
      <FlatList
        data={items}
        renderItem={({item}) => (
          <ComposingExampleItem
            key={`${item.title}${useNativeDriver ? 'native' : 'non-native'}`}
            title={item.title}
            description={item.description}
            compositeAnimation={item.compositeAnimation}
            useNativeDriver={useNativeDriver}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    padding,
    alignItems: 'stretch',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '300',
  },
  boxesContainer: {
    marginVertical: padding,
    padding,
    backgroundColor: '#eeeeee',
    borderRadius: 4,
  },
  box: {
    borderRadius: 1,
    backgroundColor: '#61dafb',
    width: boxSize,
    height: boxSize,
    marginBottom: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
});

export default ({
  title: 'Composing',
  name: 'composing',
  description: 'Combine multiple animations using composition functions',
  render: () => <ComposingExample />,
}: RNTesterModuleExample);
