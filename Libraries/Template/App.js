import React, { Fragment } from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native'

import { Header, Section, LinkList } from './components'

const reloadInstructions = Platform.select({
  ios: 'Press Cmd+R to reload. Cmd+D or shake for dev menu.',
  android:
    'Double tap R on your keyboard to reload. Shake or press menu button for dev menu.',
})

export default function App() {
  return (
    <Fragment>
      <SafeAreaView style={styles.topSafeArea} />

      <SafeAreaView style={styles.bottomSafeArea}>
        <StatusBar barStyle="dark-content" />
        <ScrollView bounces={false}>
          <Header />
          <View style={styles.body}>
            <Section
              title="Step One"
              description="Edit App.js to change this screen and then come back to see your edits."
            />
            <Section
              title="See Your Changes"
              description={reloadInstructions}
            />
            <Section title="Debug" description={reloadInstructions} />
            <Section
              title="Learn More"
              description="Read the docs on what to do once you've seen how to work in React Native."
            />
            <LinkList />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Fragment>
  )
}

const styles = StyleSheet.create({
  topSafeArea: {
    flex: 0,
    backgroundColor: '#F3F3F3',
  },
  bottomSafeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  body: {
    backgroundColor: '#FFF',
  },
})
