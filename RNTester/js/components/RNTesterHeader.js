import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {RNTesterThemeContext} from './RNTesterTheme';
import {Back} from '../utils/RNTesterActions.js';

const backButtonSource = require('./../assets/header-back-button.png');

const Header = ({
  title,
  backButton,
}: {
  title: string,
  backButton: boolean,
  ...
}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => {
              console.log('Header Back Button Pressed');
              Back();
            }}>
            <View>
              {backButton ? (
                <Image
                  source={backButtonSource}
                  style={styles.backButtonIcon}
                />
              ) : null}
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        </View>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

// From RNTesterApp.android.js toolbar height
const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    backgroundColor: '#F3F8FF',
    flexDirection: 'row',
  },
  backButtonContainer: {
    flex: 1,
  },
  backButtonIcon: {
    width: 30,
    height: 30,
    marginTop: 13,
    marginLeft: 5,
  },
  titleContainer: {
    flex: 8,
  },
  titleText: {
    fontSize: 30,
    marginTop: 7,
  },
});

module.exports = Header;