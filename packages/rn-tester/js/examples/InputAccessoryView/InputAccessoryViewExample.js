/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {useTheme} from '../../components/RNTesterTheme';
import {useState} from 'react';
import {
  Alert,
  Button,
  InputAccessoryView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function Message(): React.Node {
  return (
    <View style={styles.textBubbleBackground}>
      <Text style={styles.text}>Text Message</Text>
    </View>
  );
}

function TextInputBar(): React.Node {
  const {PlaceholderTextColor, LabelColor, SeparatorColor} = useTheme();
  const [text, setText] = useState<string>('');

  return (
    <View style={[styles.textInputContainer, {borderTopColor: SeparatorColor}]}>
      <TextInput
        style={[styles.textInput, {color: LabelColor}]}
        onChangeText={setText}
        value={text}
        placeholder={'Type a message...'}
        placeholderTextColor={PlaceholderTextColor}
      />
      <Button
        onPress={() => {
          Alert.alert('You tapped the button!');
        }}
        title="Send"
      />
    </View>
  );
}

function InputAccessoryViewExample(): React.Node {
  const {BackgroundColor} = useTheme();

  return (
    <>
      <ScrollView style={styles.fill} keyboardDismissMode="interactive">
        {Array(15)
          .fill()
          .map((_, i) => (
            <Message key={i} />
          ))}
      </ScrollView>
      <InputAccessoryView backgroundColor={BackgroundColor}>
        <TextInputBar />
      </InputAccessoryView>
    </>
  );
}

const BAR_HEIGHT = 44;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    height: BAR_HEIGHT,
  },
  textInput: {
    flex: 1,
    paddingLeft: 10,
  },
  text: {
    padding: 10,
    color: 'white',
  },
  textBubbleBackground: {
    backgroundColor: '#2f7bf6',
    borderRadius: 20,
    width: 110,
    margin: 20,
  },
});

exports.title = 'InputAccessoryView';
exports.description =
  'Example showing how to use an InputAccessoryView to build an iMessage-like sticky text input';
exports.examples = [
  {
    title: 'Simple view with sticky input',
    render: function (): React.Node {
      return <InputAccessoryViewExample />;
    },
  },
];
