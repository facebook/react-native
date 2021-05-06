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

const BookmarkTab = ({handleNavBarPress, isBookmarkActive, theme}) => (
  <View style={styles.centerBox}>
    <View
      style={[
        styles.centralBoxCutout,
        {backgroundColor: theme.BackgroundColor},
      ]}
    />
    <View style={styles.floatContainer}>
      <Pressable
        testID="bookmarks-tab"
        onPress={() => handleNavBarPress({screen: 'bookmarks'})}>
        <View
          style={[styles.floatingButton, {backgroundColor: theme.BorderColor}]}>
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
);

const NavbarButton = ({
  testID,
  theme,
  isActive,
  activeImage,
  inactiveImage,
  label,
  handlePress,
  iconStyle,
}) => (
  <Pressable
    testID={testID}
    onPress={handlePress}
    style={[styles.navButton, {backgroundColor: theme.BackgroundColor}]}>
    <View
      style={[styles.pressableContent, isActive ? styles.activeBar : null]}
      collapsable={false}>
      <Image
        style={iconStyle}
        source={isActive ? activeImage : inactiveImage}
      />
      <Text style={isActive ? styles.activeText : styles.inactiveText}>
        {label}
      </Text>
    </View>
  </Pressable>
);

const ComponentTab = ({isComponentActive, handleNavBarPress, theme}) => (
  <NavbarButton
    testID="components-tab"
    label="Components"
    handlePress={() => handleNavBarPress({screen: 'components'})}
    activeImage={require('./../assets/bottom-nav-components-icon-active.png')}
    inactiveImage={require('./../assets/bottom-nav-components-icon-inactive.png')}
    isActive={isComponentActive}
    theme={theme}
    iconStyle={styles.componentIcon}
  />
);

const APITab = ({isAPIActive, handleNavBarPress, theme}) => (
  <NavbarButton
    testID="apis-tab"
    label="APIs"
    handlePress={() => handleNavBarPress({screen: 'apis'})}
    activeImage={require('./../assets/bottom-nav-apis-icon-active.png')}
    inactiveImage={require('./../assets/bottom-nav-apis-icon-inactive.png')}
    isActive={isAPIActive}
    theme={theme}
    iconStyle={styles.apiIcon}
  />
);

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
        <ComponentTab
          isComponentActive={isComponentActive}
          handleNavBarPress={handleNavBarPress}
          theme={theme}
        />
        <BookmarkTab
          isBookmarkActive={isBookmarkActive}
          handleNavBarPress={handleNavBarPress}
          theme={theme}
        />
        <APITab
          isAPIActive={isAPIActive}
          handleNavBarPress={handleNavBarPress}
          theme={theme}
        />
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
