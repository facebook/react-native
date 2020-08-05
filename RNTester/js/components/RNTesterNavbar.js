import React, {useState} from 'react';
import {Text, View, StyleSheet, Image, TouchableOpacity} from 'react-native';
const APP_COLOR = '#F3F8FF';
const RNTesterActions = require('../utils/RNTesterActions');

const BottomTabNavigation = ({onNavigate}) => {
  /** to be attached to navigation framework */
  const [apiActive, setApiActive] = useState(false);
  const [componentActive, setComponentActive] = useState(true);
  const [bookmarkActive, setBookmarkActive] = useState(false);

  return (
    <View>
      {/** Bottom Navbar code */}
      <View style={{zIndex:2}}>
        {/** floating button in center  */}
        <View style={styles.floatContainer}>
          <TouchableOpacity
            onPress={() => {
              setApiActive(false);
              setComponentActive(false);
              setBookmarkActive(true);
              onNavigate(RNTesterActions.OpenList('bookmark'));
            }}>
            <View style={styles.floatingButton} >
            <Image
              style={styles.bookmarkIcon}
              source={
                bookmarkActive
                  ? require('../assets/bottom-nav-bookmark-fill.png')
                  : require('../assets/bottom-nav-bookmark-outline.png')
              }
            />
            </View>
          </TouchableOpacity>
        </View>

        {/** component and APIs tab  */}
        <View style={styles.buttonContainer}>
          {/** left tab with Components  */}
          <View style={styles.leftBox}>
            {/** @attention attach navigation endpoints here */}
            <TouchableOpacity
              onPress={() => {
                onNavigate(RNTesterActions.OpenList('component'));
                if (componentActive) {
                  return;
                } else {
                  setComponentActive(true);
                  setApiActive(false);
                  setBookmarkActive(false);
                }
              }}>
              <Image
                style={styles.componentIcon}
                source={
                  componentActive
                    ? require('./../assets/bottom-nav-components-icon-active.png')
                    : require('./../assets/bottom-nav-components-icon-inactive.png')
                }
              />
              <Text
                style={
                  componentActive ? styles.activeText : styles.inactiveText
                }>
                Components
              </Text>
            </TouchableOpacity>
          </View>

          {/** central tab with frame  */}
          <View style={styles.centerBox}>
            <Image
              style={styles.centralBoxCutout}
              source={require('./../assets/bottom-nav-center-box.png')}
            />
          </View>

          {/** right tab with Components  */}
          <View style={styles.rightBox}>
            {/** @attention attach navigation endpoints here */}
            <TouchableOpacity
              onPress={() => {
                onNavigate(RNTesterActions.OpenList('api'));
                if (apiActive) {
                  return;
                } else {
                  setComponentActive(false);
                  setApiActive(true);
                  setBookmarkActive(false);
                }
              }}>
              <Image
                style={styles.apiIcon}
                source={
                  apiActive
                    ? require('./../assets/bottom-nav-apis-icon-active.png')
                    : require('./../assets/bottom-nav-apis-icon-inactive.png')
                }
              />
              <Text style={apiActive ? styles.activeText : styles.inactiveText}>
                APIs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatContainer: {
    flex: 1,
    zIndex: 1,
    bottom: -36,
    alignItems: 'center',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  floatingButton: {
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

module.exports = BottomTabNavigation;