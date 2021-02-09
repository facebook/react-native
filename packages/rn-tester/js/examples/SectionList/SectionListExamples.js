/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {Pressable, SectionList, StyleSheet, Text, View} from 'react-native';
import * as React from 'react';

type Props = {
  example?: ?string,
};

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
    data: ['Cheesecake', 'Ice Cream'],
  },
];

const VIEWABILITY_CONFIG = {
  minimumViewTime: 1000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const Item = ({title}) => (
  <View style={styles.item} testID={title}>
    <Text style={styles.title}>{title}</Text>
  </View>
);

function getExample(example, output, ref) {
  switch (example) {
    case 'onViewableItemsChanged':
      return {
        props: {
          onViewableItemsChanged: info =>
            output(
              info.viewableItems
                .filter(
                  viewToken => viewToken.index != null && viewToken.isViewable,
                )
                .map(viewToken => viewToken.item)
                .join(', '),
            ),
          viewabilityConfig: VIEWABILITY_CONFIG,
        },
        startTest: () => {},
      };

    case 'onEndReached':
      return {
        props: {
          onEndReached: info => output('onEndReached'),
          onEndReachedThreshold: 0,
        },
        startTest: () => {
          const scrollResponder = ref?.current?.getScrollResponder();
          if (scrollResponder != null) {
            scrollResponder.scrollToEnd();
          }
        },
      };
    default:
      return {};
  }
}

function SectionListExamples(props: Props): React.Node {
  const [output, setOutput] = React.useState('');
  const ref = React.useRef<?React.ElementRef<typeof SectionList>>();
  const {startTest, props: testProps} = getExample(
    props.example,
    setOutput,
    ref,
  );
  return (
    <View>
      <View testID="test_container" style={styles.row}>
        <Text testID="output">{output}</Text>
        <Pressable testID="start_test" onPress={startTest}>
          <Text>Test</Text>
        </Pressable>
      </View>
      <SectionList
        ref={ref}
        testID="section_list"
        sections={DATA}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <Item title={item} />}
        renderSectionHeader={({section: {title}}) => (
          <Text style={styles.header}>{title}</Text>
        )}
        style={styles.sectionList}
        {...testProps}
      />
    </View>
  );
}

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
  sectionList: {height: '90%'},
  row: {
    flexDirection: 'row',
    height: '10%',
  },
});

export default SectionListExamples;
