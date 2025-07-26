/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';

import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Button,
  ScrollView,
  SafeAreaView,
} from 'react-native';

/**
 * Reproducer for Flow v0.275.0 syntax issue with Metro bundler
 * 
 * This file demonstrates that simply importing React Native components
 * that use Flow component syntax causes Metro bundler to fail with:
 * 
 * Error: Unable to parse file .../Libraries/Components/ActivityIndicator/ActivityIndicator.js
 * Unexpected token, expected ";" (63:28)
 * 
 * The issue occurs during bundling, not at runtime.
 * 
 * Affected components include:
 * - ActivityIndicator
 * - Button  
 * - ScrollView
 * - SafeAreaView
 * - Pressable
 * - Switch
 * - StatusBar
 * - And many more...
 * 
 * Root cause: Flow v0.233.0+ introduced component syntax that Metro's 
 * Babel parser cannot parse.
 * 
 * Related issues:
 * - https://github.com/facebook/react-native/issues/52850
 * - https://github.com/facebook/metro/issues/1540
 */

export default function Playground(props: {}): React.Node {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Flow v0.275.0 Syntax Issue Reproducer
      </Text>
      
      <Text style={styles.text}>
        If you see this, the issue has been fixed!
      </Text>
      
      <Text style={styles.text}>
        However, in React Native 0.79.5, Metro bundler fails before
        this component can render due to Flow syntax parsing errors.
      </Text>
      
      {/* These components use Flow component syntax that breaks Metro */}
      <ActivityIndicator />
      <Button title="Test Button" onPress={() => {}} />
      
      <ScrollView style={styles.scrollView}>
        <Text>ScrollView also uses component syntax</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollView: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 10,
  },
});