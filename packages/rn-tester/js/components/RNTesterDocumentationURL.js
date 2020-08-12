import React from 'react';
import {Image, StyleSheet, TouchableOpacity} from 'react-native';
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';

const RNTesterDocumentationURL = ({documentationURL}) => (
  <TouchableOpacity
    style={styles.container}
    onPress={() => openURLInBrowser(documentationURL)}>
      <Image
        source={require('../assets/documentation.png')}
        style={styles.icon}
      />
   </TouchableOpacity>
);

export default RNTesterDocumentationURL;

const styles = StyleSheet.create({
  container: {
    textDecorationLine: 'underline',
    position: 'absolute',
    bottom: 3,
    right: 25,
  },
  icon: {
    width: 25,
    height: 25,
  },
});
