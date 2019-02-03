/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, CheckBox, Switch, Button } from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' + 'Shake or press menu button for dev menu',
});
getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      counter: 0,
      checked: false,
      checkedColor: 'green',
      uncheckedColor: 'red',
    };
  }

  setRandomColors = () => {
    const colors = ['red', 'green', 'blue', 'orange', 'pink', 'black', 'violet'];

    this.setState({
      counter: this.state.counter + 1,
      checkedColor: colors[getRandomInt(0, colors.length - 1)],
      uncheckedColor: colors[getRandomInt(0, colors.length - 1)],
    });
  };

  removeColors = () => {
    this.setState({
      counter: this.state.counter + 1,
      checkedColor: null,
      uncheckedColor: null,
    });
  };

  render() {
    const { checkedColor, uncheckedColor, counter } = this.state;
    const isAlternatingChecked = counter % 2 === 0;
    const alternatingText = isAlternatingChecked ? 'checked' : 'unchecked';
    const alternatingProps = isAlternatingChecked
      ? {
          checkedColor: checkedColor,
        }
      : {
          uncheckedColor: uncheckedColor,
        };
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text style={styles.welcome}>checkedColor: {checkedColor}</Text>
        <Text style={styles.welcome}>uncheckedColor: {uncheckedColor}</Text>
        <View style={styles.row}>
          <Text>follows both colors</Text>
          <CheckBox
            value={this.state.checked}
            tintColors={{on: checkedColor, off: uncheckedColor}}
            onValueChange={value => this.setState({ checked: value })}
          />
        </View>
{/* 
        <View style={styles.row}>
          <Text>follows checked color only</Text>
          <CheckBox value={true} checkedColor={checkedColor} />
        </View>
        <View style={styles.row}>
          <Text>follows unchecked color only</Text>
          <CheckBox value={false} uncheckedColor={uncheckedColor} />
        </View> */}

        {/* <View style={styles.row}>
          <Text>alternating: follows only {alternatingText} now</Text>
          <CheckBox value={isAlternatingChecked} {...alternatingProps} />
        </View> */}

        <View style={{ height: 15 }} />
        <Button title="set random colors" onPress={this.setRandomColors} />
        <View style={{ height: 15 }} />
        <Button title="remove colors" onPress={this.removeColors} />

        <Text style={styles.instructions}>{instructions}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  row: {
    flexDirection: 'row',
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});