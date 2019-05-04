import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import Colors from './Colors';

const Header = () => (
  <View style={styles.container}>
    <ImageBackground
      accessibilityRole={'image'}
      source={require('../logo.png')}
      style={styles.backgroundLogo}
    />

    <Text style={styles.text}>Welcome to React Native</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 32,
    backgroundColor: Colors.lighter,
  },
  backgroundLogo: {
    position: 'absolute',
    top: -20,
    left: -200,
    opacity: 0.20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 540,
    width: 540,
  },
  text: {
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.black,
  },
});

export default Header;
