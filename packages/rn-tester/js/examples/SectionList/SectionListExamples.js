/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  Pressable,
  Button,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as React from 'react';
type SectionListProps = React.ElementProps<typeof SectionList>;

type ViewabilityConfig = $PropertyType<SectionListProps, 'viewabilityConfig'>;

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

const Separator = (defaultColor, highlightColor, isSectionSeparator) => ({
  leadingItem,
  trailingItem,
  highlighted,
  hasBeenHighlighted,
}) => {
  const text = `${
    isSectionSeparator ? 'Section ' : ''
  }separator for leading ${leadingItem} and trailing ${trailingItem} has ${
    !hasBeenHighlighted ? 'not ' : ''
  }been pressed`;

  return (
    <View
      style={[
        styles.separator,
        {backgroundColor: highlighted ? highlightColor : defaultColor},
      ]}>
      <Text style={styles.separtorText}>{text}</Text>
    </View>
  );
};

export function SectionList_inverted(): React.Node {
  const [output, setOutput] = React.useState('inverted false');
  const [exampleProps, setExampleProps] = React.useState({
    inverted: false,
  });

  const onTest = () => {
    setExampleProps({
      inverted: !exampleProps.inverted,
    });
    setOutput(`Is inverted: ${(!exampleProps.inverted).toString()}`);
  };

  return (
    <SectionListExampleWithForwardedRef
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
      testLabel={exampleProps.inverted ? 'Toggle false' : 'Toggle true'}
    />
  );
}

export function SectionList_contentInset(): React.Node {
  const [initialContentInset, toggledContentInset] = [44, 88];

  const [output, setOutput] = React.useState(
    `contentInset top: ${initialContentInset.toString()}`,
  );
  const [exampleProps, setExampleProps] = React.useState({
    automaticallyAdjustContentInsets: false,
    contentInset: {top: initialContentInset},
    contentOffset: {y: -initialContentInset, x: 0},
  });

  const onTest = () => {
    const newContentInset =
      exampleProps.contentInset.top === initialContentInset
        ? toggledContentInset
        : initialContentInset;
    setExampleProps({
      automaticallyAdjustContentInsets: false,
      contentInset: {top: newContentInset},
      contentOffset: {y: -newContentInset, x: 0},
    });
    setOutput(`contentInset top: ${newContentInset.toString()}`);
  };

  return (
    <>
      <View
        style={[
          styles.titleContainer,
          {height: exampleProps.contentInset.top},
        ]}>
        <Text style={styles.titleText}>Menu</Text>
      </View>
      <SectionListExampleWithForwardedRef
        exampleProps={exampleProps}
        testOutput={output}
        onTest={onTest}
        testLabel={'Toggle header size'}
      />
    </>
  );
}

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
  const ref = React.useRef(null);

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

export function SectionList_withSeparators(): React.Node {
  const exampleProps = {
    ItemSeparatorComponent: Separator('lightgreen', 'green', false),
    SectionSeparatorComponent: Separator('lightblue', 'blue', true),
  };
  const ref = React.useRef(null);

  return (
    <SectionListExampleWithForwardedRef ref={ref} exampleProps={exampleProps} />
  );
}

export function SectionList_onViewableItemsChanged(props: {
  viewabilityConfig: ViewabilityConfig,
  offScreen?: ?boolean,
  horizontal?: ?boolean,
  useScrollRefScroll?: ?boolean,
}): React.Node {
  const {viewabilityConfig, offScreen, horizontal, useScrollRefScroll} = props;
  const [output, setOutput] = React.useState('');
  const exampleProps = {
    onViewableItemsChanged: info =>
      setOutput(
        info.viewableItems
          .filter(viewToken => viewToken.index != null && viewToken.isViewable)
          .map(viewToken => viewToken.item)
          .join(', '),
      ),
    viewabilityConfig,
    horizontal,
  };
  const ref = React.useRef(null);
  const onTest =
    useScrollRefScroll === true
      ? () => {
          ref?.current?.getScrollResponder()?.scrollToEnd();
        }
      : null;

  return (
    <SectionListExampleWithForwardedRef
      ref={ref}
      exampleProps={exampleProps}
      onTest={onTest}
      testOutput={output}>
      {offScreen === true ? <View style={styles.offScreen} /> : null}
    </SectionListExampleWithForwardedRef>
  );
}

type Props = {
  exampleProps: $Shape<React.ElementConfig<typeof SectionList>>,
  onTest?: ?() => void,
  testLabel?: ?string,
  testOutput?: ?string,
  children?: ?React.Node,
};

const SectionListExampleWithForwardedRef = React.forwardRef(
  (props: Props, ref): React.Node => {
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
          sections={DATA}
          keyExtractor={(item, index) => item + index}
          style={styles.list}
          renderItem={Item}
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
    width: '80%',
    fontSize: 12,
  },
  separator: {
    height: 12,
  },
  separtorText: {
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
