import React from 'react';
import {Text, View, StyleSheet, Image, Pressable} from 'react-native';
const RNTesterActions = require('../utils/RNTesterActions');

const APP_COLOR = '#F3F8FF';

const RNTesterNavbar = ({onNavigate, screen}) => {
  /** to be attached to navigation framework */
  const isAPIActive =  screen === 'api';
  const isComponentActive =   screen === 'component';
  const isBookmarkActive =   screen === 'bookmark';

  return (
    <View>
      {/** Bottom Navbar code */}
        {/** component and APIs tab  */}
        <View style={styles.buttonContainer}>
          {/** left tab with Components  */}
          <View style={styles.leftBox}>
            {/** @attention attach navigation endpoints here */}
            <Pressable
              onPress={() =>  onNavigate(RNTesterActions.OpenList('component'))}>
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
            </Pressable>
          </View>

          {/** central tab with bookmark icon  */}
          <View style={styles.centerBox}>
            <Image
              style={styles.centralBoxCutout}
              source={require('./../assets/bottom-nav-center-box.png')}
            />

          {/** floating button in center  */}
          <View style={styles.floatContainer}>
            <Pressable
              onPress={() => { onNavigate(RNTesterActions.OpenList('bookmark')) }}>
                <View style={styles.floatingButton} >
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

          {/** right tab with Components  */}
         <Pressable onPress={() => { onNavigate(RNTesterActions.OpenList('api')) }}

          style={styles.rightBox}>
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
    backgroundColor: '#005DFF',
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
    color: 'black',
  },
  inactiveText: {
    color: '#B1B4BA',
  },
  centralBoxCutout: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  leftBox: {
    flex: 1,
    height: 65,
    backgroundColor: APP_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    flex: 1,
    height: 65,
  },
  rightBox: {
    flex: 1,
    height: 65,
    backgroundColor: APP_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

module.exports = RNTesterNavbar;
