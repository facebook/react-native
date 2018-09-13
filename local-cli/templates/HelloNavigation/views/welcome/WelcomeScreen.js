/** @format */

import React, {Component} from 'react';
import {Image, Platform, StyleSheet} from 'react-native';

import ListItem from '../../components/ListItem';
import WelcomeText from './WelcomeText';

export default class WelcomeScreen extends Component {
  static navigationOptions = {
    title: 'Welcome',
    // You can now set header: null on any component to hide the header
    header: Platform.OS === 'ios' ? undefined : null,
    tabBarIcon: ({tintColor}) => (
      <Image
        // Using react-native-vector-icons works here too
        source={require('./welcome-icon.png')}
        style={[styles.icon, {tintColor: tintColor}]}
      />
    ),
  };

  render() {
    return <WelcomeText />;
  }
}

const styles = StyleSheet.create({
  icon: {
    width: 30,
    height: 26,
  },
});
