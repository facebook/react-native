/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native/addons');
var {
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  invariant,
} = React;

var createExamplePage = require('./createExamplePage');

var EXAMPLES = [
  require('./ViewExample'),
  require('./LayoutExample'),
  require('./TextExample.ios'),
  require('./TextInputExample'),
  require('./ExpandingTextExample'),
  require('./ImageExample'),
  require('./ListViewSimpleExample'),
  require('./ListViewPagingExample'),
  require('./NavigatorIOSExample'),
  require('./StatusBarIOSExample'),
  require('./PointerEventsExample'),
  require('./TouchableExample'),
  require('./ActivityIndicatorExample'),
  require('./ScrollViewExample'),
  require('./DatePickerExample'),
  require('./GeolocationExample'),
  require('./TabBarExample'),
  require('./SwitchExample'),
];

var UIExplorerList = React.createClass({
  render: function() {
    return (
      <ScrollView style={styles.list}>
        <View style={styles.group}>
          <View style={styles.line} />
          {EXAMPLES.map(this._renderRow)}
          <View style={styles.line} />
        </View>
      </ScrollView>
    );
  },

  _renderRow: function(example, i) {
    invariant(example.title, 'Example must provide a title.');
    return (
      <View key={i}>
        <TouchableHighlight onPress={() => this._onPressRow(example)}>
          <View style={styles.row}>
            <Text style={styles.rowTitleText}>
              {example.title}
            </Text>
            <Text style={styles.rowDetailText}>
              {example.description}
            </Text>
          </View>
        </TouchableHighlight>
        <View style={styles.separator} />
      </View>
    );
  },

  _onPressRow: function(example) {
    var Component = example.examples ?
      createExamplePage(null, example) :
      example;
    this.props.navigator.push({
      title: Component.title,
      component: Component,
    });
  },
});

var styles = StyleSheet.create({
  list: {
    backgroundColor: '#eeeeee',
  },
  group: {
    backgroundColor: 'white',
    marginVertical: 25,
  },
  line: {
    backgroundColor: '#bbbbbb',
    height: 1 / PixelRatio.get(),
  },
  row: {
    backgroundColor: 'white',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  separator: {
    height: 1 / PixelRatio.get(),
    backgroundColor: '#bbbbbb',
    marginLeft: 15,
  },
  rowTitleText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  rowDetailText: {
    fontSize: 15,
    color: '#888888',
    lineHeight: 20,
  },
});

module.exports = UIExplorerList;
