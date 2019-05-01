import React from 'react'
import { StyleSheet, ScrollView, View, Platform, StatusBar } from 'react-native'

import { Header, Section, LinkList } from './Components'

const reloadInstructions = Platform.select({
  ios: 'Press Cmd+R to reload. Cmd+D or shake for dev menu.',
  android:
    'Double tap R on your keyboard to reload. Shake or press menu button for dev menu.',
})

export default function App() {
  return (
    <View>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView bounces={true}>
        <Header />
        <View style={styles.body}>
          <Section
            title="Step One"
            description="Edit App.js to chnage this screen and then come back to see your edits."
          />
          <Section title="See Your Changes" description={reloadInstructions} />
          <Section title="Debug" description={reloadInstructions} />
          <Section
            title="Learn More"
            description="Read the docs on what to do once you've seen how to work in React Native."
          />
          <LinkList />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
  },
})
