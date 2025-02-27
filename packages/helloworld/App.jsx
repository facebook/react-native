/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {
  Button,
  NativeModules,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import {Colors, Header} from 'react-native/Libraries/NewAppScreen';
import SampleTurboModule from './specs/NativeSampleModule';
import NativeLocalStorage from './specs/NativeLocalStorage';

const legacyModule = NativeModules.LegacyModule;

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  legacyModule.echo('Hello from React Native!');
  const [value, setValue] = React.useState('');
  const [reversedValue, setReversedValue] = React.useState('');

  const onPress = () => {
    const revString = SampleTurboModule.reverseString(value);
    setReversedValue(revString);
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [value2, setValue2] = React.useState(null);

  const [editingValue, setEditingValue] = React.useState(null);

  React.useEffect(() => {
    const storedValue = NativeLocalStorage?.getItem('myKey');
    setValue2(storedValue ?? '');
  }, []);

  function saveValue() {
    NativeLocalStorage?.setItem(editingValue ?? EMPTY, 'myKey');
    setValue2(editingValue);
  }

  function clearAll() {
    NativeLocalStorage?.clear();
    setValue2('');
  }

  function deleteValue() {
    NativeLocalStorage?.removeItem('myKey');
    setValue2('');
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Text>Write down here he text you want to revert</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Write your text here"
            onChangeText={setValue}
            value={value}
          />
          <Button title="Reverse" onPress={onPress} />
          <Text>Reversed text: {reversedValue}</Text>
        </View>
        <View>
          <Text style={styles.text}>
            Current stored value is: {value2 ?? 'No Value'}
          </Text>
          <TextInput
            placeholder="Enter the text you want to store"
            style={styles.textInput}
            onChangeText={setEditingValue}
          />
          <Button title="Save" onPress={saveValue} />
          <Button title="Delete" onPress={deleteValue} />
          <Button title="Clear" onPress={clearAll} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  text: {
    margin: 10,
    fontSize: 20,
  },
  textInput: {
    margin: 10,
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 5,
  },
});

export default App;
