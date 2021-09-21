/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {Text, View, StyleSheet, Image, Pressable} from 'react-native';

import {RNTesterThemeContext} from './RNTesterTheme';

type Props = $ReadOnly<{|
  handleNavBarPress: (data: {screen: string}) => void,
  screen: string,
  isExamplePageOpen: boolean,
|}>;

const RNTesterNavbar = ({
  handleNavBarPress,
  screen,
  isExamplePageOpen,
}: Props): React.Node => {
  const theme = React.useContext(RNTesterThemeContext);

  const isAPIActive = screen === 'apis' && !isExamplePageOpen;
  const isComponentActive = screen === 'components' && !isExamplePageOpen;
  const isBookmarkActive = screen === 'bookmarks' && !isExamplePageOpen;

  return (
    <View>
      <View style={styles.buttonContainer}>
        <Pressable
          testID="components-tab"
          onPress={() => handleNavBarPress({screen: 'components'})}
          style={[styles.navButton, {backgroundColor: theme.BackgroundColor}]}>
          <View
            style={[
              styles.pressableContent,
              isComponentActive ? styles.activeBar : null,
            ]}
            collapsable={false}>
            <Image
              style={styles.componentIcon}
              source={
                isComponentActive
                  ? require('./../assets/bottom-nav-components-icon-active.png')
                  : require('./../assets/bottom-nav-components-icon-inactive.png')
              }
            />
            <Text
              style={
                isComponentActive ? styles.activeText : styles.inactiveText
              }>
              Components
            </Text>
          </View>
        </Pressable>

        <View style={styles.centerBox}>
          <Image
            style={styles.centralBoxCutout}
            source={require('./../assets/bottom-nav-center-box.png')}
          />

          <View style={styles.floatContainer}>
            <Pressable
              testID="bookmarks-tab"
              onPress={() => handleNavBarPress({screen: 'bookmarks'})}>
              <View
                style={[
                  styles.floatingButton,
                  {backgroundColor: theme.BorderColor},
                ]}>
                <Image
                  style={styles.bookmarkIcon}
                  source={
                    isBookmarkActive
                      ? require('../assets/bottom-nav-bookmark-fill.png')
                      : require('../assets/bottom-nav-bookmark-outline.png')
                  }
                />
              </View>
            </Pressable>
          </View>
        </View>

        <Pressable
          testID="apis-tab"
          onPress={() => handleNavBarPress({screen: 'apis'})}
          style={[styles.navButton, {backgroundColor: theme.BackgroundColor}]}>
          <View
            style={[
              styles.pressableContent,
              isAPIActive ? styles.activeBar : null,
            ]}
            collapsable={false}>
            <Image
              style={styles.apiIcon}
              source={
                isAPIActive
                  ? require('./../assets/bottom-nav-apis-icon-active.png')
                  : require('./../assets/bottom-nav-apis-icon-inactive.png')
              }
            />
            <Text style={isAPIActive ? styles.activeText : styles.inactiveText}>
              APIs
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatContainer: {
    flex: 1,
    zIndex: 2,
    alignItems: 'center',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  floatingButton: {
    top: -20,
    width: 50,
    height: 50,
    borderRadius: 500,
    alignContent: 'center',
    shadowColor: 'black',
    shadowOffset: {
      height: 5,
      width: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 5,
  },
  bookmarkIcon: {
    width: 30,
    height: 30,
    margin: 10,
  },
  componentIcon: {
    width: 20,
    height: 20,
    alignSelf: 'center',
  },
  apiIcon: {
    width: 30,
    height: 20,
    alignSelf: 'center',
  },
  activeText: {
    color: '#5E5F62',
  },
  inactiveText: {
    color: '#B1B4BA',
  },
  activeBar: {
    borderTopWidth: 2,
    borderColor: '#005DFF',
  },
  centralBoxCutout: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  centerBox: {
    flex: 1,
    height: 65,
  },
  navButton: {
    flex: 1,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressableContent: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

module.exports = RNTesterNavbar;
