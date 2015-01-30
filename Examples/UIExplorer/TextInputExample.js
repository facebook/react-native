/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule TextInputExample
 */
'use strict';

var React = require('react-native');
var {
  Text,
  TextInput,
  View,
  StyleSheet,
} = React;

var WithLabel = React.createClass({
  render: function() {
    return (
      <View style={styles.labelContainer}>
        <View style={styles.label}>
          <Text>{this.props.label}</Text>
        </View>
        {this.props.children}
      </View>
    );
  }
});

var TextEventsExample = React.createClass({
  getInitialState: function() {
    return {
      curText: '<No Event>',
      prevText: '<No Event>',
    };
  },

  updateText: function(text) {
    this.setState({
      curText: text,
      prevText: this.state.curText,
    });
  },

  render: function() {
    return (
      <View>
        <TextInput
          autoCapitalize={TextInput.autoCapitalizeMode.none}
          placeholder="Enter text to see events"
          autoCorrect={false}
          onFocus={() => this.updateText('onFocus')}
          onBlur={() => this.updateText('onBlur')}
          onChange={(event) => this.updateText(
            'onChange text: ' + event.nativeEvent.text
          )}
          onEndEditing={(event) => this.updateText(
            'onEndEditing text: ' + event.nativeEvent.text
          )}
          onSubmitEditing={(event) => this.updateText(
            'onSubmitEditing text: ' + event.nativeEvent.text
          )}
          style={styles.default}
        />
        <Text style={styles.eventLabel}>
          {this.state.curText}{'\n'}
          (prev: {this.state.prevText})
        </Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  page: {
    paddingBottom: 300,
  },
  default: {
    height: 26,
    borderWidth: 0.5,
    borderColor: '#0f0f0f',
    padding: 4,
    flex: 1,
    fontSize: 13,
  },
  multiline: {
    borderWidth: 0.5,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    height: 50,
  },
  eventLabel: {
    margin: 3,
    fontSize: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    flex: 1,
  },
  label: {
    width: 80,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    marginRight: 10,
    paddingTop: 2,
  },
});

exports.title = '<TextInput>';
exports.description = 'Single-line text inputs.';
exports.examples = [
  {
    title: 'Auto-focus',
    render: function() {
      return <TextInput autoFocus={true} style={styles.default} />;
    }
  },
  {
    title: 'Auto-capitalize',
    render: function() {
      return (
        <View>
          <WithLabel label="none">
            <TextInput
              autoCapitalize={TextInput.autoCapitalizeMode.none}
              style={styles.default}
            />
          </WithLabel>
          <WithLabel label="sentences">
            <TextInput
              autoCapitalize={TextInput.autoCapitalizeMode.sentences}
              style={styles.default}
            />
          </WithLabel>
          <WithLabel label="words">
            <TextInput
              autoCapitalize={TextInput.autoCapitalizeMode.words}
              style={styles.default}
            />
          </WithLabel>
          <WithLabel label="characters">
            <TextInput
              autoCapitalize={TextInput.autoCapitalizeMode.characters}
              style={styles.default}
            />
          </WithLabel>
        </View>
      );
    }
  },
  {
    title: 'Auto-correct',
    render: function() {
      return (
        <View>
          <WithLabel label="true">
            <TextInput autoCorrect={true} style={styles.default} />
          </WithLabel>
          <WithLabel label="false">
            <TextInput autoCorrect={false} style={styles.default} />
          </WithLabel>
        </View>
      );
    }
  },
  {
    title: 'Event handling',
    render: () => <TextEventsExample />,
  },
  {
    title: 'Colored input text',
    render: function() {
      return (
        <View>
          <TextInput
            style={[styles.default, {color: 'blue'}]}
            value="Blue"
          />
          <TextInput
            style={[styles.default, {color: 'green'}]}
            value="Green"
          />
        </View>
      );
    }
  },
];
