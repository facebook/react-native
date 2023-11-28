import * as React from 'react';
import {Text, SafeAreaView, StyleSheet, Pressable, View} from 'react-native';

const RNTesterApp = () => {
  const email =
    'From vincenzoddragon+five@gmail.com  From vincenzoddrlxagon+five@gmail.com';
  return (
    <>
      <View style={styles.container}>
        <View style={styles.flexBrokenStyle}>
          <Text
            textBreakStrategy="simple"
            numberOfLines={1}
            style={{backgroundColor: 'pink'}}>
            {email}
          </Text>
        </View>
      </View>
      <View style={styles.container}>
        <View style={styles.fullWidth}>
          <Text numberOfLines={1} style={styles.textStyle}>Example 2</Text>
        </View>
      </View>
    </>
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
  flexBrokenStyle: {
    flexDirection: 'row',
  },
  flexBrokenStyle2: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
    backgroundColor: 'red',
  },
  textStyle: {
    color: '#E7ECE9',
    fontSize: 15,
    textAlign: 'left',
    flexShrink: 1,
    marginLeft: 12,
    fontWeight: '600',
    writingDirection: 'ltr',
    lineHeight: 20,
    width: 30,
    backgroundColor: "pink",
  },
});
