/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {
  Alert,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  Button,
  Pressable,
  TouchableOpacity,
  View,
} = require('react-native');

const {useState} = require('react');

const onButtonPress = () => {
  Alert.alert('Successfully Registered!');
};

const TextInputForm = () => {
  return (
    <View>
      <TextInput
        accessibilityLabel="Text input field"
        placeholder="Email"
        style={styles.textInput}
      />
      <TextInput
        accessibilityLabel="Text input field"
        placeholder="Username"
        style={styles.textInput}
      />
      <TextInput
        accessibilityLabel="Text input field"
        placeholder="Password"
        style={styles.textInput}
      />
      <TextInput
        accessibilityLabel="Text input field"
        placeholder="Confirm Password"
        style={styles.textInput}
      />
      <Button title="Register" onPress={onButtonPress} />
    </View>
  );
};

const CloseButton = props => {
  return (
    <View
      style={[
        styles.closeView,
        {marginHorizontal: props.behavior === 'position' ? 0 : 25},
      ]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => props.setModalOpen(false)}
        style={styles.closeButton}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
};

const KeyboardAvoidingViewBehaviour = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [behavior, setBehavior] = useState('padding');
  return (
    <View style={styles.outerContainer}>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView behavior={behavior} style={styles.container}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
            }}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setBehavior('padding')}
              style={[
                styles.pillStyle,
                {backgroundColor: behavior === 'padding' ? 'blue' : 'white'},
              ]}>
              <Text style={{color: behavior === 'padding' ? 'white' : 'blue'}}>
                Padding
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setBehavior('position')}
              style={[
                styles.pillStyle,
                {backgroundColor: behavior === 'position' ? 'blue' : 'white'},
              ]}>
              <Text style={{color: behavior === 'position' ? 'white' : 'blue'}}>
                Position
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setBehavior('height')}
              style={[
                styles.pillStyle,
                {backgroundColor: behavior === 'height' ? 'blue' : 'white'},
              ]}>
              <Text
                style={{
                  color: behavior === 'height' ? 'white' : 'blue',
                }}>
                Height
              </Text>
            </TouchableOpacity>
          </View>
          <CloseButton behavior={behavior} setModalOpen={setModalOpen} />
          <TextInputForm />
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setModalOpen(true)}>
          <Text>Open Example</Text>
        </Pressable>
      </View>
    </View>
  );
};

const KeyboardAvoidingDisabled = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <View style={styles.outerContainer}>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView
          enabled={false}
          behavior={'height'}
          style={styles.container}>
          <CloseButton behavior={'height'} setModalOpen={setModalOpen} />
          <TextInputForm />
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setModalOpen(true)}>
          <Text>Open Example</Text>
        </Pressable>
      </View>
    </View>
  );
};

const KeyboardAvoidingVerticalOffset = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <View style={styles.outerContainer}>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={20}
          behavior={'padding'}
          style={styles.container}>
          <CloseButton behavior={'height'} setModalOpen={setModalOpen} />
          <TextInputForm />
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setModalOpen(true)}>
          <Text>Open Example</Text>
        </Pressable>
      </View>
    </View>
  );
};

const KeyboardAvoidingContentContainerStyle = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <View>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={20}
          behavior={'position'}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <CloseButton behavior={'height'} setModalOpen={setModalOpen} />
          <TextInputForm />
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setModalOpen(true)}>
          <Text>Open Example</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    paddingTop: 20,
    backgroundColor: '#abdebf',
  },
  textInput: {
    borderRadius: 5,
    borderWidth: 1,
    height: 44,
    width: 300,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  closeView: {
    alignSelf: 'stretch',
  },
  pillStyle: {
    padding: 10,
    marginHorizontal: 5,
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'blue',
  },
  closeButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 10,
    padding: 10,
  },
});

exports.title = 'KeyboardAvoidingView';
exports.description =
  'Base component for views that automatically adjust their height or position to move out of the way of the keyboard.';
exports.examples = [
  {
    title: 'Keyboard Avoiding View with different behaviors',
    description:
      ('Specify how to react to the presence of the keyboard. Android and iOS both interact' +
        'with this prop differently. On both iOS and Android, setting behavior is recommended.': string),
    render(): React.Node {
      return <KeyboardAvoidingViewBehaviour />;
    },
  },
  {
    title: 'Keyboard Avoiding View with keyboardVerticalOffset={distance}',
    description:
      ('This is the distance between the top of the user screen and the react native' +
        'view, may be non-zero in some use cases. Defaults to 0.': string),
    render(): React.Node {
      return <KeyboardAvoidingVerticalOffset />;
    },
  },
  {
    title: 'Keyboard Avoiding View with enabled={false}',
    render(): React.Node {
      return <KeyboardAvoidingDisabled />;
    },
  },
  {
    title: 'Keyboard Avoiding View with contentContainerStyle',
    render(): React.Node {
      return <KeyboardAvoidingContentContainerStyle />;
    },
  },
];
