import React, { Component } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ListItem from '../../components/ListItem';

export default class FriendListScreen extends Component {

  static navigationOptions = {
    title: 'Friends',
    header: {
      visible: Platform.OS === 'ios',
    },
    tabBar: {
      icon: ({ tintColor }) => (
        <Image
          // Using react-native-vector-icons works here too
          source={require('./friend-icon.png')}
          style={[styles.icon, {tintColor: tintColor}]}
        />
      ),
    },
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>A list of friends here.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    padding: 16,
  },
  icon: {
    width: 30,
    height: 26,
  },
});
