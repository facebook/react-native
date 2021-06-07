/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {
  Animated,
  PanResponder,
  View,
  StyleSheet,
  FlatList,
  useWindowDimensions,
} from 'react-native';

module.exports = {
  displayName: 'SwipeableCardExample',
  framework: 'React',
  title: 'SwipeableCard',
  category: 'Basic',
  description:
    'Example of a swipeable card with scrollable content to test PanResponder and JSResponderHandler interaction.',
  examples: [
    {
      title: 'SwipeableCardExample',
      description: ('This example creates a swipeable card using PanResponder. ' +
        'Under the hood, JSResponderHandler should prevent scroll when the card is being swiped.': string),
      render: function(): React.Node {
        return <SwipeableCard />;
      },
    },
  ],
};

function SwipeableCard() {
  const movementX = React.useRef(new Animated.Value(0)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (e, gestureState) => {
        const {dx} = gestureState;
        return Math.abs(dx) > 5;
      },
      onPanResponderMove: (e, gestureState) => {
        Animated.event([null, {dx: movementX}], {
          useNativeDriver: false,
        })(e, gestureState);
      },
      onPanResponderEnd: (e, gestureState) => {
        Animated.timing(movementX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const {width} = useWindowDimensions();
  const rotation = movementX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: (['-5deg', '0deg', '5deg']: $ReadOnlyArray<string>),
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{translateX: movementX}, {rotateZ: rotation}],
          flex: 1,
        }}>
        <Card />
      </Animated.View>
    </View>
  );
}

const cardData = Array(5);

function Card(props) {
  const renderItem = ({item, index}) => (
    <View style={index % 2 === 0 ? styles.cardSectionA : styles.cardSectionB} />
  );
  return (
    <View style={styles.card}>
      <FlatList style={{flex: 1}} data={cardData} renderItem={renderItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 30,
  },
  card: {
    flex: 1,
    margin: 5,
  },
  cardSectionA: {
    height: 200,
    backgroundColor: 'aquamarine',
  },
  cardSectionB: {
    height: 200,
    backgroundColor: 'pink',
  },
});
