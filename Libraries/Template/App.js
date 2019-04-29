import React from 'react';
import {StyleSheet, ScrollView, View} from 'react-native';
import { Header, Section, LinkList } from './Components'

export default function App() {
  return <ScrollView
    bounces={false}
  >
    <Header />
    <View style={styles.body}>
      <Section
        title='Step One'
        description='Edit App.js to chnage this screen and then come back to see your edits.'
      />
      <Section
        title='See Your Changes'
        description='Press Cmd + R inside the simulator to reload your app&#39;s code.'
      />
      <Section
        title='Debug'
        description='Press Cmd + D in the Simulator or Shake your device to open the React Native debug menu.'
      />
      <Section
        title='Learn More'
        description='Read the docs on what to do once you&#39;ve seen how to work in React Native.'
      />
      <LinkList />
    </View>
  </ScrollView>
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 25
  }
});
