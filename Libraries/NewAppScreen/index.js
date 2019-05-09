/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import React, {Fragment} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Platform,
  StatusBar,
} from 'react-native';

import Header from './components/Header';
import LearnMoreLinks from './components/LearnMoreLinks';
import Colors from './components/Colors';

const Section = ({children}) => (
  <View style={styles.sectionContainer}>{children}</View>
);

const ReloadInstructions = () => {
  return Platform.OS === 'ios' ? (
    <Text style={styles.sectionDescription}>
      Press <Text style={styles.highlight}>Cmd+R</Text> in the simulator to
      reload your app's code
    </Text>
  ) : (
    <Text style={styles.sectionDescription}>
      Double tap <Text style={styles.highlight}>R</Text> on your keyboard to
      reload your app's code
    </Text>
  );
};

const DebugInstructions = () => {
  return Platform.OS === 'ios' ? (
    <Text style={styles.sectionDescription}>
      Press <Text style={styles.highlight}>Cmd+D</Text> in the simulator or{' '}
      <Text style={styles.highlight}>Shake</Text> your device to open the React
      Native debug menu.
    </Text>
  ) : (
    <Text style={styles.sectionDescription}>
      Press <Text style={styles.highlight}>menu button</Text> or
      <Text style={styles.highlight}>Shake</Text> your device to open the React
      Native debug menu.
    </Text>
  );
};

const App = () => {
  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}>
        <Header />
        <View style={styles.body}>
          <Section>
            <Text style={styles.sectionTitle}>Step One</Text>
            <Text style={styles.sectionDescription}>
              Edit <Text style={styles.highlight}>App.js</Text> to change this
              screen and then come back to see your edits.
            </Text>
          </Section>

          <Section>
            <Text style={styles.sectionTitle}>See Your Changes</Text>
            <ReloadInstructions />
          </Section>

          <Section>
            <Text style={styles.sectionTitle}>Debug</Text>
            <DebugInstructions />
          </Section>

          <Section>
            <Text style={styles.sectionTitle}>Learn More</Text>
            <Text style={styles.sectionDescription}>
              Read the docs on what to do once seen how to work in React Native.
            </Text>
          </Section>
          <LearnMoreLinks />
        </View>
      </ScrollView>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
