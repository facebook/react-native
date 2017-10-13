'use strict';

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableNativeFeedback,
  View,
} from 'react-native';

/**
 * Renders the right type of Touchable for the list item, based on platform.
 */
const Touchable = ({onPress, children}) => {
  const child = React.Children.only(children);
  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback onPress={onPress}>
        {child}
      </TouchableNativeFeedback>
    );
  } else {
    return (
      <TouchableHighlight onPress={onPress} underlayColor="#ddd">
        {child}
      </TouchableHighlight>
    );
  }
};

const ListItem = ({label, onPress}) => (
  <Touchable onPress={onPress}>
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
    </View>
  </Touchable>
);

const styles = StyleSheet.create({
  item: {
    height: 48,
    justifyContent: 'center',
    paddingLeft: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  label: {
    fontSize: 16,
  }
});

export default ListItem;
