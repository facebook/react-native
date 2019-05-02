import React, { Fragment } from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native'

import Header from './components/Header'
import Section from './components/Section'
import LinkList from './components/LinkList'

const reloadInstructions = Platform.select({
  ios: `Press Cmd+R in the simulator to reload your app's code`,
  android: `Double tap R on your keyboard to reload your app's code`,
})

const debugInstructions = Platform.select({
  ios:
    'Press Cmd+D in the simulator or Shake your device to open the React Native debug menu.',
  android:
    'Press menu button or Shake your device to open the React Native debug menu.',
})

export default (App = () => {
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
            <Section title="Debug" description={debugInstructions} />
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
})

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
