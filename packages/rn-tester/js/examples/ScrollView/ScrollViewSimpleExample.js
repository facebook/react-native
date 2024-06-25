/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
} = require('react-native');

const nullthrows = require('nullthrows');
const NUM_ITEMS = 20;

class ScrollViewSimpleExample extends React.Component<{...}> {
  makeItems: (nItems: number, styles: any) => Array<any> = (
    nItems: number,
    styles,
  ): Array<any> => {
    const items = [];
    for (let i = 0; i < nItems; i++) {
      items[i] = (
        <TouchableOpacity key={i} style={styles}>
          <Text testID="scroll_view_item">{'Item ' + i}</Text>
        </TouchableOpacity>
      );
    }
    return items;
  };

  render(): React.Node {
    // One of the items is a horizontal scroll view
    let _scrollView: ?React.ElementRef<typeof ScrollView>;
    let _horizontalScrollView1: ?React.ElementRef<typeof ScrollView>;
    let _horizontalScrollView2: ?React.ElementRef<typeof ScrollView>;
    const items = this.makeItems(NUM_ITEMS, styles.itemWrapper);
    items[4] = (
      <ScrollView
        ref={scrollView => {
          _horizontalScrollView1 = scrollView;
        }}
        key={'scrollView'}
        horizontal={true}
        onMomentumScrollEnd={() => {
          console.log('First Horizontal ScrollView onMomentumScrollEnd');
        }}
        onMomentumScrollBegin={e => {
          console.log(
            'First Horizontal ScrollView onMomentumScrollBegin',
            e.nativeEvent,
          );
        }}>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
        ])}
      </ScrollView>
    );
    items.push(
      <ScrollView
        ref={scrollView => {
          _horizontalScrollView2 = scrollView;
        }}
        key={'scrollViewSnap'}
        horizontal
        snapToInterval={210.0}
        pagingEnabled
        onMomentumScrollEnd={() => {
          console.log('Paging Horizontal ScrollView onMomentumScrollEnd');
        }}
        onMomentumScrollBegin={e => {
          console.log(
            'Paging Horizontal ScrollView onMomentumScrollBegin',
            e.nativeEvent,
          );
        }}>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
          styles.horizontalPagingItemWrapper,
        ])}
      </ScrollView>,
    );
    items.push(
      <ScrollView
        key={'scrollViewSnapStart'}
        horizontal
        snapToAlignment={'start'}
        pagingEnabled>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
          styles.horizontalPagingItemWrapper,
        ])}
      </ScrollView>,
    );
    items.push(
      <ScrollView
        key={'scrollViewSnapCenter'}
        horizontal
        snapToAlignment={'center'}
        pagingEnabled>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
          styles.horizontalPagingItemWrapper,
        ])}
      </ScrollView>,
    );
    items.push(
      <ScrollView
        key={'scrollViewSnapEnd'}
        horizontal
        snapToAlignment={'end'}
        pagingEnabled>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
          styles.horizontalPagingItemWrapper,
        ])}
      </ScrollView>,
    );

    return (
      <View style={styles.container}>
        <View style={styles.options}>
          <Button
            title="Animated Scroll to top"
            onPress={() => {
              nullthrows(_scrollView).scrollTo({x: 0, y: 0, animated: true});
              nullthrows(_horizontalScrollView1).scrollTo({
                x: 0,
                y: 0,
                animated: true,
              });
              nullthrows(_horizontalScrollView2).scrollTo({
                x: 0,
                y: 0,
                animated: true,
              });
            }}
          />
          <Button
            title="Animated Scroll to End"
            onPress={() => {
              nullthrows(_scrollView).scrollToEnd({animated: true});
              nullthrows(_horizontalScrollView1).scrollToEnd({animated: true});
              nullthrows(_horizontalScrollView2).scrollToEnd({animated: true});
            }}
            color={'blue'}
          />
        </View>
        <ScrollView
          ref={scrollView => {
            _scrollView = scrollView;
          }}
          style={styles.verticalScrollView}
          onMomentumScrollEnd={() => {
            console.log('Vertical ScrollView onMomentumScrollEnd');
          }}
          onMomentumScrollBegin={e => {
            console.log(
              'Vertical ScrollView onMomentumScrollBegin',
              e.nativeEvent,
            );
          }}>
          {items}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgb(239, 239, 244)',
    flex: 1,
  },
  verticalScrollView: {
    margin: 10,
    backgroundColor: 'white',
    flexGrow: 1,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemWrapper: {
    backgroundColor: '#dddddd',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 5,
    borderColor: '#a52a2a',
    padding: 30,
    margin: 5,
  },
  horizontalItemWrapper: {
    padding: 50,
  },
  horizontalPagingItemWrapper: {
    width: 200,
  },
});

exports.title = 'ScrollViewSimpleExample';
exports.category = 'Basic';
exports.description =
  'Component that enables scrolling through child components.';

exports.examples = [
  {
    title: 'Simple scroll view',
    render(): React.MixedElement {
      return <ScrollViewSimpleExample />;
    },
  },
];
