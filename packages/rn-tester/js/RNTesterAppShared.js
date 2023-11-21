import * as React from 'react';
import {Text, SafeAreaView, StyleSheet, Pressable, View} from 'react-native';

const RNTesterApp = () => {
  const email =
    'From vincenzoddragon+five@gmail.com  From vincenzoddrlxagon+five@gmail.com';
  return (
    <View style={styles.container}>
      <View style={{alignSelf: 'flex-start', backgroundColor: 'red'}}>
        <Text numberOfLines={1} style={{backgroundColor: 'pink'}}>
          {email}
        </Text>
      </View>
    </View>
  );
};

export default RNTesterApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'yellow',
  },
});
