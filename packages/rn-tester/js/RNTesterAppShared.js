/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {
  BackHandler,
  StyleSheet,
  useColorScheme,
  View,
  LogBox,
  Dimensions,
  Text,
  Image,
} from 'react-native';
import * as React from 'react';

import RNTesterModuleContainer from './components/RNTesterModuleContainer';
import RNTesterModuleList from './components/RNTesterModuleList';
import RNTesterNavBar, {navBarHeight} from './components/RNTesterNavbar';
import RNTesterList from './utils/RNTesterList';
import {
  Screens,
  initialState,
  getExamplesListWithBookmarksAndRecentlyUsed,
  getInitialStateFromAsyncStorage,
} from './utils/testerStateUtils';
import {useAsyncStorageReducer} from './utils/useAsyncStorageReducer';
import {RNTesterReducer, RNTesterActionsType} from './utils/RNTesterReducer';
import {RNTesterThemeContext, themes} from './components/RNTesterTheme';
import RNTTitleBar from './components/RNTTitleBar';
import {RNTesterEmptyBookmarksState} from './components/RNTesterEmptyBookmarksState';

const APP_STATE_KEY = 'RNTesterAppState.v3';

// RNTester App currently uses AsyncStorage from react-native for storing navigation state
// and bookmark items.
// TODO: Vendor AsyncStorage or create our own.
LogBox.ignoreLogs([/AsyncStorage has been extracted from react-native/]);

const RNTesterApp = (): React.Node => {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        top: 100,
        borderWidth: 1,
        gap: 20,
        // rowGap: 20,
        // columnGap: 30,
      }}>
      <View style={{backgroundColor: 'black', height: 30, width: 30}} />
      <View style={{backgroundColor: 'black', height: 30, width: 30}} />
      <View
        style={{
          backgroundColor: 'pink',
          height: 30,
          flexBasis: 30,
        }}
      />
      <View style={{backgroundColor: 'black', height: 30, width: 30}} />
      <View style={{backgroundColor: 'black', height: 30, width: 30}} />
      <View style={{backgroundColor: 'black', height: 30, width: 30}} />
      <View style={{backgroundColor: 'black', height: 30, width: 30}} />
      <View style={{backgroundColor: 'pink', height: 30, width: 30}} />
      <View style={{backgroundColor: 'pink', height: 30, width: 30}} />
      <View style={{backgroundColor: 'pink', height: 30, width: 30}} />
      <View style={{backgroundColor: 'pink', height: 30, width: 30}} />
    </View>
  );
};
export default RNTesterApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomNavbar: {
    height: navBarHeight,
  },
  hidden: {
    display: 'none',
  },
});
