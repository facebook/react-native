/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {Button, SectionList, StyleSheet, Text, View} from 'react-native';
import * as React from 'react';

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

export function SectionList_stickySectionHeadersEnabled(): React.Node {
  const [output, setOutput] = React.useState(
    'stickySectionHeadersEnabled false',
  );
  const [exampleProps, setExampleProps] = React.useState({
    stickySectionHeadersEnabled: false,
  });

  const onTest = () => {
    setExampleProps({
      stickySectionHeadersEnabled: !exampleProps.stickySectionHeadersEnabled,
    });
    setOutput(
      `stickySectionHeadersEnabled ${(!exampleProps.stickySectionHeadersEnabled).toString()}`,
    );
  };

  return (
    <SectionListExampleWithForwardedRef
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
      testLabel={
        exampleProps.stickySectionHeadersEnabled ? 'Sticky Off' : 'Sticky On'
      }
    />
  );
}

export function SectionList_onEndReached(): React.Node {
  const [output, setOutput] = React.useState('');
  const exampleProps = {
    onEndReached: info => setOutput('onEndReached'),
    onEndReachedThreshold: 0,
  };
  const ref = React.createRef<?React.ElementRef<typeof SectionList>>();

  const onTest = () => {
    const scrollResponder = ref?.current?.getScrollResponder();
    if (scrollResponder != null) {
      scrollResponder.scrollToEnd();
    }
  };

  return (
    <SectionListExampleWithForwardedRef
      ref={ref}
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
    />
  );
}

export function SectionList_onViewableItemsChanged(): React.Node {
  const [output, setOutput] = React.useState('');
  const exampleProps = {
    onViewableItemsChanged: info =>
      setOutput(
        info.viewableItems
          .filter(viewToken => viewToken.index != null && viewToken.isViewable)
          .map(viewToken => viewToken.item)
          .join(', '),
      ),
    viewabilityConfig: VIEWABILITY_CONFIG,
  };

  return (
    <SectionListExampleWithForwardedRef
      exampleProps={exampleProps}
      onTest={null}
      testOutput={output}
    />
  );
}

type Props = {
  exampleProps: $Shape<React.ElementConfig<typeof SectionList>>,
  onTest?: ?() => void,
  testLabel?: ?string,
  testOutput: ?string,
};

const SectionListExampleWithForwardedRef = React.forwardRef(
  function SectionListExample(
    props: Props,
    ref: ?React.ElementRef<typeof SectionListExampleWithForwardedRef>,
  ): React.Node {
    return (
      <View>
        <View testID="test_container" style={styles.testContainer}>
          <Text numberOfLines={1} testID="output">
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
        <SectionList
          ref={ref}
          testID="section_list"
          sections={DATA}
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <Item title={item} />}
          renderSectionHeader={({section: {title}}) => (
            <Text style={styles.header}>{title}</Text>
          )}
          {...props.exampleProps}
        />
      </View>
    );
  },
);

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
    padding: 4,
  },
  output: {
    fontSize: 12,
  },
});
