/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type { Node } from "react";

import ImageBackground from "../../Image/ImageBackground";
import StyleSheet from "../../StyleSheet/StyleSheet";
import Text from "../../Text/Text";
import View from "react-native/Libraries/Components/View/View";
import useColorScheme from "../../Utilities/useColorScheme";
import Colors from "./Colors";
import NewArchitectureBadge from "./NewArchitectureBadge";
import React from "react";

import appData from "../../../../../app.json";

const Header = (): Node => {
  const isDarkMode = useColorScheme() === "dark";
  return (
    <ImageBackground
      accessibilityRole="image"
      testID="new-app-screen-header"
      source={require("./logo.png")}
      style={[
        styles.background,
        {
          backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
        },
      ]}
      imageStyle={styles.logo}
    >
      <NewArchitectureBadge />
      <View>
        <Text
          style={[
            styles.headerText,
            {
              color: isDarkMode ? Colors.white : Colors.black,
            },
          ]}
        >
          Welcome to
        </Text>
        <Text
          style={[
            styles.displayName,
            {
              color: isDarkMode ? Colors.white : Colors.black,
            },
          ]}
        >
          {appData.displayName}
        </Text>
        <Text
          style={[
            styles.poweredByText,
            {
              color: isDarkMode ? Colors.white : Colors.black,
            },
          ]}
        >
          Powered By React Native
        </Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    paddingBottom: 40,
    paddingTop: 96,
    paddingHorizontal: 32,
  },
  logo: {
    opacity: 0.2,
    overflow: "visible",
    resizeMode: "cover",
    /*
     * These negative margins allow the image to be offset similarly across screen sizes and component sizes.
     *
     * The source logo.png image is 512x512px, so as such, these margins attempt to be relative to the
     * source image's size.
     */
    marginLeft: -128,
    marginBottom: -192,
  },
  headerText: {
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    color: "white",
  },
  displayName: {
    textTransform: "capitalize",
    textAlign: "center",
    fontSize: 48,
    fontWeight: "700",
  },
  poweredByText: {
    fontSize: 28,
    fontWeight: "normal",
    textAlign: "center",
  },
});

export default Header;
