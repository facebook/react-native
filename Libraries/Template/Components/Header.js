import React from 'react'
import { View, Text, StyleSheet, ImageBackground } from 'react-native'

export default (Header = () => (
  <View style={styles.container}>
    <ImageBackground
      source={require('../logo.png')}
      style={styles.backgroundLogo}
    />

    <Text style={styles.text}>Welcome to React Native</Text>
  </View>
))

const styles = StyleSheet.create({
  container: {
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F3F3',
  },
  backgroundLogo: {
    position: 'absolute',
    top: -20,
    left: -200,
    opacity: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    height: 540,
    width: 540,
  },
  text: {
    maxWidth: 250,
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
  },
})
