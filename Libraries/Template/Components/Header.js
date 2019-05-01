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
      <Text style={styles.text}>Welcome to React Native</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#F3F3F3',
  },
  animatedLogo: {
    width: 180,
    height: 180,
  },
  text: {
    maxWidth: 250,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
  },
})
