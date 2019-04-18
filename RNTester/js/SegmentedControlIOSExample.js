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
const {SegmentedControlIOS, Text, View, StyleSheet} = require('react-native');

class BasicSegmentedControlExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <View style={{marginBottom: 10}}>
          <SegmentedControlIOS values={['One', 'Two']} />
        </View>
        <View>
          <SegmentedControlIOS
            values={['One', 'Two', 'Three', 'Four', 'Five']}
          />
        </View>
      </View>
    );
  }
}

class PreSelectedSegmentedControlExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <View>
          <SegmentedControlIOS values={['One', 'Two']} selectedIndex={0} />
        </View>
      </View>
    );
  }
}

class MomentarySegmentedControlExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <View>
          <SegmentedControlIOS values={['One', 'Two']} momentary={true} />
        </View>
      </View>
    );
  }
}

class DisabledSegmentedControlExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <View>
          <SegmentedControlIOS
            enabled={false}
            values={['One', 'Two']}
            selectedIndex={1}
          />
        </View>
      </View>
    );
  }
}

class ColorSegmentedControlExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <View style={{marginBottom: 10}}>
          <SegmentedControlIOS
            tintColor="#ff0000"
            values={['One', 'Two', 'Three', 'Four']}
            selectedIndex={0}
          />
        </View>
        <View>
          <SegmentedControlIOS
            tintColor="#00ff00"
            values={['One', 'Two', 'Three']}
            selectedIndex={1}
          />
        </View>
      </View>
    );
  }
}

class EventSegmentedControlExample extends React.Component<
  {},
  $FlowFixMeState,
> {
  state = {
    values: ['One', 'Two', 'Three'],
    value: 'Not selected',
    selectedIndex: undefined,
  };

  render() {
    return (
      <View>
        <Text style={styles.text}>Value: {this.state.value}</Text>
        <Text style={styles.text}>Index: {this.state.selectedIndex}</Text>
        <SegmentedControlIOS
          values={this.state.values}
          selectedIndex={this.state.selectedIndex}
          onChange={this._onChange}
          onValueChange={this._onValueChange}
        />
      </View>
    );
  }

  _onChange = event => {
    this.setState({
      selectedIndex: event.nativeEvent.selectedSegmentIndex,
    });
  };

  _onValueChange = value => {
    this.setState({
      value: value,
    });
  };
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    margin: 10,
  },
});

exports.title = '<SegmentedControlIOS>';
exports.displayName = 'SegmentedControlExample';
exports.description = 'Native segmented control';
exports.examples = [
  {
    title: 'Segmented controls can have values',
    render(): React.Element<any> {
      return <BasicSegmentedControlExample />;
    },
  },
  {
    title: 'Segmented controls can have a pre-selected value',
    render(): React.Element<any> {
      return <PreSelectedSegmentedControlExample />;
    },
  },
  {
    title: 'Segmented controls can be momentary',
    render(): React.Element<any> {
      return <MomentarySegmentedControlExample />;
    },
  },
  {
    title: 'Segmented controls can be disabled',
    render(): React.Element<any> {
      return <DisabledSegmentedControlExample />;
    },
  },
  {
    title: 'Custom colors can be provided',
    render(): React.Element<any> {
      return <ColorSegmentedControlExample />;
    },
  },
  {
    title: 'Change events can be detected',
    render(): React.Element<any> {
      return <EventSegmentedControlExample />;
    },
  },
];
