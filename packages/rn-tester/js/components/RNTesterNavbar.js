/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {RNTesterTheme} from './RNTesterTheme';

import {RNTesterThemeContext} from './RNTesterTheme';
import * as React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
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
      <Text
        style={{
          color: isActive
            ? theme.NavBarLabelActiveColor
            : theme.NavBarLabelInactiveColor,
        }}>
        {label}
      </Text>
    </View>
  </Pressable>
);

const ComponentTab = ({
  isComponentActive,
  handleNavBarPress,
  theme,
}: $TEMPORARY$object<{
  handleNavBarPress: (data: {screen: string}) => void,
  isComponentActive: boolean,
  theme: RNTesterTheme,
}>) => (
  <NavbarButton
    testID="components-tab"
    label="Components"
    handlePress={() => handleNavBarPress({screen: 'components'})}
    activeImage={theme.NavBarComponentsActiveIcon}
    inactiveImage={theme.NavBarComponentsInactiveIcon}
    isActive={isComponentActive}
    theme={theme}
    iconStyle={styles.componentIcon}
  />
);

const APITab = ({
  isAPIActive,
  handleNavBarPress,
  theme,
}: $TEMPORARY$object<{
  handleNavBarPress: (data: {screen: string}) => void,
  isAPIActive: boolean,
  theme: RNTesterTheme,
}>) => (
  <NavbarButton
    testID="apis-tab"
    label="APIs"
    handlePress={() => handleNavBarPress({screen: 'apis'})}
    activeImage={theme.NavBarAPIsActiveIcon}
    inactiveImage={theme.NavBarAPIsInactiveIcon}
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

  return (
    <View>
      <View style={styles.buttonContainer}>
        <ComponentTab
          isComponentActive={isComponentActive}
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

export const navBarHeight = 65;

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
    height: navBarHeight,
  },
  navButton: {
    flex: 1,
    height: navBarHeight,
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

export default RNTesterNavbar;
