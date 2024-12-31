/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {SectionBase} from 'react-native/Libraries/Lists/SectionList';

import * as React from 'react';
import {
  Button,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DATA = [
  {
    title: 'Main dishes',
    data: ['Pizza', 'Burger', 'Risotto'],
  },
  {
    title: 'Sides',
    data: ['French Fries', 'Onion Rings', 'Fried Shrimps'],
  },
  {
    title: 'Drinks',
    data: ['Water', 'Coke', 'Beer'],
  },
  {
    title: 'Desserts',
    data: ['Cheesecake', 'Brownie'],
  },
];

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const Item = ({item, section, separators}) => {
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

type Props = $ReadOnly<{
  exampleProps: Partial<React.ElementConfig<typeof SectionList>>,
  onTest?: ?() => void,
  testLabel?: ?string,
  testOutput?: ?string,
  children?: ?React.Node,
}>;

const SectionListBaseExample: component(
  ref: React.RefSetter<SectionList<SectionBase<mixed>>>,
  ...props: Props
) = React.forwardRef((props: Props, ref): React.Node => {
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
      <SectionList
        ref={ref}
        testID="section_list"
        accessibilityRole="list"
        // $FlowFixMe[incompatible-type]
        sections={DATA}
        keyExtractor={(item, index) => item + index}
        style={styles.list}
        renderItem={Item}
        /* $FlowFixMe[prop-missing] Error revealed after improved builtin React
         * utility types */
        renderSectionHeader={({section: {title}}) => (
          <Text style={styles.header}>{title}</Text>
        )}
        {...props.exampleProps}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'pink',
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 32,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
  },
  testContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f7ff',
    height: 40,
  },
  output: {
    flex: 1,
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
  container: {flex: 1},
});

export default SectionListBaseExample;
