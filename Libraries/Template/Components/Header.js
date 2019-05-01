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
    paddingVertical: 45,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedLogo: {
    width: 200,
    height: 200,
  },
  text: {
    paddingHorizontal: 25,
    maxWidth: 350,
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
  },
})
