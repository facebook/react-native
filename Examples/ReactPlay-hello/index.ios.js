import React from "react";

import {
  AppRegistry,
  View,
  Text,
  StyleSheet,
} from 'react-native';

function App() {
  return (
    <View style={style.container}>
      <Text>hello react native</Text>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(255,0,0,0.3)',
  }
});

// Having to register the app name is kinda lame.
AppRegistry.registerComponent('SampleApp', () => App);