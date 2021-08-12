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
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as React from 'react';
type FlatListProps = React.ElementProps<typeof FlatList>;

type ViewabilityConfig = $PropertyType<FlatListProps, 'viewabilityConfig'>;

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

const Item = ({item, separators}) => {
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

const Separator = (defaultColor, highlightColor) => ({
  leadingItem,
  trailingItem,
  highlighted,
  hasBeenHighlighted,
}) => {
  const text = `Separator for leading ${leadingItem} and trailing ${trailingItem} has ${
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

export function FlatList_inverted(): React.Node {
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
    <FlatListExampleWithForwardedRef
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
      testLabel={exampleProps.inverted ? 'Toggle false' : 'Toggle true'}
    />
  );
}

export function FlatList_contentInset(): React.Node {
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
      <FlatListExampleWithForwardedRef
        exampleProps={exampleProps}
        testOutput={output}
        onTest={onTest}
        testLabel={'Toggle header size'}
      />
    </>
  );
}
export function FlatList_onEndReached(): React.Node {
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
    <FlatListExampleWithForwardedRef
      ref={ref}
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
    />
  );
}

export function FlatList_withSeparators(): React.Node {
  const exampleProps = {
    ItemSeparatorComponent: Separator('lightgreen', 'green'),
  };
  const ref = React.useRef(null);

  return (
    <FlatListExampleWithForwardedRef ref={ref} exampleProps={exampleProps} />
  );
}

export function FlatList_onViewableItemsChanged(props: {
  viewabilityConfig: ViewabilityConfig,
  offScreen?: ?boolean,
  horizontal?: ?boolean,
  useScrollRefScroll?: ?boolean,
}): React.Node {
  const {viewabilityConfig, offScreen, horizontal, useScrollRefScroll} = props;
  const [output, setOutput] = React.useState('');
  const onViewableItemsChanged = React.useCallback(
    info =>
      setOutput(
        info.viewableItems
          .filter(viewToken => viewToken.index != null && viewToken.isViewable)
          .map(viewToken => viewToken.item)
          .join(', '),
      ),
    [setOutput],
  );
  const exampleProps = {
    onViewableItemsChanged,
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
    <FlatListExampleWithForwardedRef
      ref={ref}
      exampleProps={exampleProps}
      onTest={onTest}
      testOutput={output}>
      {offScreen === true ? <View style={styles.offScreen} /> : null}
    </FlatListExampleWithForwardedRef>
  );
}

type Props = {
  exampleProps: $Shape<React.ElementConfig<typeof FlatList>>,
  onTest?: ?() => void,
  testLabel?: ?string,
  testOutput?: ?string,
  children?: ?React.Node,
};

const FlatListExampleWithForwardedRef = React.forwardRef(
  (props: Props, ref) => {
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
    fontSize: 12,
    width: '80%',
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
