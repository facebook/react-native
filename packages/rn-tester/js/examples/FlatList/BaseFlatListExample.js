/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RenderItemProps} from 'react-native/Libraries/Lists/VirtualizedList';
import {
  Pressable,
  Button,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as React from 'react';

const DATA = [
  'Pizza',
  'Burger',
  'Risotto',
  'French Fries',
  'Onion Rings',
  'Fried Shrimps',
  'Water',
  'Coke',
  'Beer',
  'Cheesecake',
  'Ice Cream',
];

const Item = ({item, separators}: RenderItemProps<string>) => {
  return (
    <Pressable
      onPressIn={() => {
        separators.highlight();
      }}
      onPress={() => {
        separators.updateProps('trailing', {hasBeenHighlighted: true});
        separators.updateProps('leading', {hasBeenHighlighted: true});
      }}
      onPressOut={() => {
        separators.unhighlight();
      }}
      style={({pressed}) => [
        styles.item,
        {
          backgroundColor: pressed ? 'red' : 'pink',
        },
      ]}
      testID={item}>
      <Text style={styles.title}>{item}</Text>
    </Pressable>
  );
};

type Props = {
  exampleProps: $Shape<React.ElementConfig<typeof FlatList>>,
  onTest?: ?() => void,
  testLabel?: ?string,
  testOutput?: ?string,
  children?: ?React.Node,
};

const BaseFlatListExample = React.forwardRef((props: Props, ref) => {
  return (
    <View style={styles.container}>
      {props.testOutput != null ? (
        <View testID="test_container" style={styles.testContainer}>
          <Text style={styles.output} numberOfLines={1} testID="output">
            {props.testOutput}
          </Text>
          {props.onTest != null ? (
            <Button
              testID="start_test"
              onPress={props.onTest}
              title={props.testLabel ?? 'Test'}
            />
          ) : null}
        </View>
      ) : null}
      {props.children}
      <FlatList
        {...props.exampleProps}
        ref={ref}
        testID="flat_list"
        data={DATA}
        keyExtractor={(item, index) => item + index}
        style={styles.list}
        renderItem={Item}
      />
    </View>
  );
});

export default (BaseFlatListExample: React.AbstractComponent<
  Props,
  FlatList<string>,
>);

const ITEM_INNER_HEIGHT = 70;
const ITEM_MARGIN = 8;
export const ITEM_HEIGHT: number = ITEM_INNER_HEIGHT + ITEM_MARGIN * 2;

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'pink',
    paddingHorizontal: 20,
    height: ITEM_INNER_HEIGHT,
    marginVertical: ITEM_MARGIN,
    justifyContent: 'center',
  },
  header: {
    fontSize: 32,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
  },
  titleContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'gray',
    zIndex: 1,
  },
  titleText: {
    fontSize: 24,
    lineHeight: 44,
    fontWeight: 'bold',
  },
  testContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f7ff',
    height: 40,
  },
  output: {
    fontSize: 12,
  },
  separator: {
    height: 12,
  },
  separatorText: {
    fontSize: 10,
  },
  list: {
    flex: 1,
  },
  container: {flex: 1},
  offScreen: {
    height: 1000,
  },
});
