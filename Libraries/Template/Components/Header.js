import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'

export default function Header() {
  return (
    <View style={styles.container}>
      <LottieView
        style={styles.animatedLogo}
        source={require('../logo-animation.json')}
        autoPlay
        loop
      />
      <Text style={styles.text}>Welcome to</Text>
      <Text style={styles.text}>React Native</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#333',
  },
  animatedLogo: {
    width: 180,
    height: 180,
  },
  text: {
    maxWidth: 350,
    paddingHorizontal: 24,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#CCC',
  },
})
