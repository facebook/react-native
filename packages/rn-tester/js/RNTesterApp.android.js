/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import React, {useState} from 'react';
import {AppRegistry, TextInput, View} from 'react-native';

//import RNTesterApp from './RNTesterAppShared';

//AppRegistry.registerComponent('RNTesterApp', () => RNTesterApp);

AppRegistry.registerComponent('RNTesterApp', () => () => {
  const [value, setValue] = useState('k');
  return (
    <View style={{padding: 50}}>
      <TextInput
        rows={5}
        multiline={true}
        style={{borderWidth: 1, borderColor: 'black', padding: 0}}
        placeholder="Five line input using rows prop"
        defaultValue={value}
        onChangeText={setValue}
      />
    </View>
  );
});

//module.exports = RNTesterApp;
