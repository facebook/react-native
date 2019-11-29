/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {Button, Text, TextInput, View, StyleSheet} = require('react-native');

import type {RNTesterExampleModuleItem} from '../../types/RNTesterTypes';

const styles = StyleSheet.create({
  default: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    flex: 1,
  },
  label: {
    width: 115,
    alignItems: 'flex-end',
    marginRight: 10,
    paddingTop: 2,
  },
  rewriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainder: {
    textAlign: 'right',
    width: 24,
  },
});

class WithLabel extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <View style={styles.labelContainer}>
        <View style={styles.label}>
          <Text>{this.props.label}</Text>
        </View>
        {this.props.children}
      </View>
    );
  }
}

class RewriteExample extends React.Component<$FlowFixMeProps, any> {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    const limit = 20;
    const remainder = limit - this.state.text.length;
    const remainderColor = remainder > 5 ? 'blue' : 'red';
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          multiline={false}
          maxLength={limit}
          onChangeText={text => {
            text = text.replace(/ /g, '_');
            this.setState({text});
          }}
          style={styles.default}
          value={this.state.text}
        />
        <Text style={[styles.remainder, {color: remainderColor}]}>
          {remainder}
        </Text>
      </View>
    );
  }
}

class RewriteExampleInvalidCharacters extends React.Component<
  $FlowFixMeProps,
  any,
> {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          multiline={false}
          onChangeText={text => {
            this.setState({text: text.replace(/\s/g, '')});
          }}
          style={styles.default}
          value={this.state.text}
        />
      </View>
    );
  }
}

class RewriteInvalidCharactersAndClearExample extends React.Component<
  $FlowFixMeProps,
  any,
> {
  inputRef: ?React.ElementRef<typeof TextInput> = null;

  constructor(props) {
    super(props);
    this.state = {text: ''};
  }
  render() {
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          ref={ref => {
            this.inputRef = ref;
          }}
          multiline={false}
          onChangeText={text => {
            this.setState({text: text.replace(/\s/g, '')});
          }}
          style={styles.default}
          value={this.state.text}
        />
        <Button
          onPress={() => {
            if (this.inputRef != null) {
              this.inputRef.clear();
            }
          }}
          title="Clear"
        />
      </View>
    );
  }
}

module.exports = ([
  {
    title: 'Auto-focus',
    render: function(): React.Node {
      return (
        <TextInput
          autoFocus={true}
          style={styles.default}
          accessibilityLabel="I am the accessibility label for text input"
        />
      );
    },
  },
  {
    title: "Live Re-Write (<sp>  ->  '_') + maxLength",
    render: function(): React.Node {
      return <RewriteExample />;
    },
  },
  {
    title: 'Live Re-Write (no spaces allowed)',
    render: function(): React.Node {
      return <RewriteExampleInvalidCharacters />;
    },
  },
  {
    title: 'Live Re-Write (no spaces allowed) and clear',
    render: function(): React.Node {
      return <RewriteInvalidCharactersAndClearExample />;
    },
  },
  {
    title: 'Auto-capitalize',
    render: function(): React.Node {
      return (
        <View>
          <WithLabel label="none">
            <TextInput autoCapitalize="none" style={styles.default} />
          </WithLabel>
          <WithLabel label="sentences">
            <TextInput autoCapitalize="sentences" style={styles.default} />
          </WithLabel>
          <WithLabel label="words">
            <TextInput autoCapitalize="words" style={styles.default} />
          </WithLabel>
          <WithLabel label="characters">
            <TextInput autoCapitalize="characters" style={styles.default} />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Auto-correct',
    render: function(): React.Node {
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
    },
  },
  {
    title: 'Keyboard types',
    render: function(): React.Node {
      const keyboardTypes = [
        'default',
        'ascii-capable',
        'numbers-and-punctuation',
        'url',
        'number-pad',
        'phone-pad',
        'name-phone-pad',
        'email-address',
        'decimal-pad',
        'twitter',
        'web-search',
        'ascii-capable-number-pad',
        'numeric',
      ];
      const examples = keyboardTypes.map(type => {
        return (
          <WithLabel key={type} label={type}>
            <TextInput keyboardType={type} style={styles.default} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
]: Array<RNTesterExampleModuleItem>);
