import * as React from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

exports.title = 'TextInput Layout Issue';
exports.category = 'UI';
exports.description =
  'Reproduces layout issue in multiline TextInput (#54304)';
exports.examples = [
  {
    title: 'Basic Multiline fixed-height TextInput',
    render: function (): React.Node {
      return (
        <View style={styles.container}>
          <TextInput
            style={styles.input}
            multiline
            textAlignVertical="top"
            value={'Long text line\n'.repeat(10)}
          />
        </View>
      );
    },
  },
  {
    title: 'Navigation Reproduction (Long Note → Short Note → Long Note)',
    render: function (): React.Node {
      const [screen, setScreen] = React.useState('home');
      const [note, setNote] = React.useState('');

      const longNote = `This is a long note.\nIt should overflow the visible area of the TextInput.\nWhen this screen first loads, the text may appear squashed at the top.\n\nIf you navigate back and open a short note first, and then come back here, the text alignment will fix itself.\nTry reproducing the behavior mentioned in issue #54304.`;
      const shortNote = `Short`;

      if (screen === 'home') {
        return (
          <View style={styles.home}>
            <Text style={styles.title}>Select a Note</Text>
            <TouchableOpacity
              onPress={() => {
                setNote(longNote);
                setScreen('editor');
              }}>
              <Text style={styles.button}>Long Note</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setNote(shortNote);
                setScreen('editor');
              }}>
              <Text style={styles.button}>Short Note</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>TextInput Reproduction Example</Text>
          <TextInput
            multiline
            textAlignVertical="top"
            style={styles.textInput}
            value={note}
            onChangeText={setNote}
          />
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.button}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    },
  },
];

const styles = StyleSheet.create({
  home: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: '600',
  },
  button: {
    fontSize: 18,
    color: '#007AFF',
    marginVertical: 10,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    height: 200,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 5,
  },
  textInput: {
    height: 150,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
});
