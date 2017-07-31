/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ScrollViewSimpleExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} = ReactNative;

var NUM_ITEMS = 20;

class ScrollViewSimpleExample extends React.Component {
  static title = '<ScrollView>';
  static description = 'Component that enables scrolling through child components.';

  makeItems = (nItems: number, styles): Array<any> => {
    var items = [];
    for (var i = 0; i < nItems; i++) {
       items[i] = (
         <TouchableOpacity key={i} style={styles}>
           <Text>{'Item ' + i}</Text>
         </TouchableOpacity>
       );
    }
    return items;
  };

  getListItem = (item, index) => {
    if (index === 4) {
      return (
        <ScrollView key="scrollView" horizontal>
          {this.makeItems(NUM_ITEMS, [styles.itemWrapper, styles.horizontalItemWrapper])}
        </ScrollView>
      );
    }
    else if (index === 5) {
      return (
        <ScrollView
          key="scrollViewSnap"
          horizontal
          snapToInterval={horizontalItemWidth + 2 * itemMargin}
          pagingEnabled
        >
          {this.makeItems(NUM_ITEMS, [styles.itemWrapper, styles.horizontalItemWrapper])}
        </ScrollView>
      );
    }

    return item;
  }

  render() {
    var items = this.makeItems(NUM_ITEMS, styles.itemWrapper);

    return (
      <ScrollView style={styles.verticalScrollView}>
        {items.map(this.getListItem)}
      </ScrollView>
    );
  }
}

const horizontalItemWidth = 125;
const itemMargin = 5;

var styles = StyleSheet.create({
  verticalScrollView: {
    margin: 10,
  },
  itemWrapper: {
    backgroundColor: '#dddddd',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 5,
    borderColor: '#a52a2a',
    padding: 30,
    margin: itemMargin,
  },
  horizontalItemWrapper: {
    width: horizontalItemWidth,
  }
});

module.exports = ScrollViewSimpleExample;
