/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');
const Switch = require('Switch');
const Text = require('Text');
const RNTesterStatePersister = require('./RNTesterStatePersister');
const View = require('View');

class RNTesterSettingSwitchRow extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  UNSAFE_componentWillReceiveProps(newProps) {
    const {onEnable, onDisable, persister} = this.props;
    if (newProps.persister.state !== persister.state) {
      newProps.persister.state ? onEnable() : onDisable();
    }
  }
  render() {
    const {label, persister} = this.props;
    return (
      <View style={styles.row}>
        <Text>{label}</Text>
        <Switch
          value={persister.state}
          onValueChange={value => {
            persister.setState(() => value);
          }}
        />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  row: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
RNTesterSettingSwitchRow = RNTesterStatePersister.createContainer(
  RNTesterSettingSwitchRow,
  {
    cacheKeySuffix: ({label}) => 'Switch:' + label,
    getInitialState: ({initialValue}) => initialValue,
  },
);
module.exports = RNTesterSettingSwitchRow;
