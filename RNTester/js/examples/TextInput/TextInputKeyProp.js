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
const {View, TextInput} = require('react-native');
const {useEffect, useState} = React;

function TextInputKeyProp() {
  const [startKey, setStartKey] = useState(0);

  const updateKey = () => {
    setStartKey({
      startKey: startKey + 100
    });
  };

  useEffect(() => {
    const interval = setInterval(updateKey, 3000);
    return () => clearInterval(interval);
  }, [])

  const textInputs = [];
  for (let i = 0; i < 1000; i++) {
    const key = (startKey + i).toString();
    console.log("key", key);
    // REMOVE KEY PROP TO FIX THIS
    textInputs.push(
      <TextInput 
        style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
        key={key} />
    );
  }

  return (
    <View>
      { textInputs }
    </View>
  );
}

exports.title = '<TextInputs with key prop>';
exports.description = 'Periodically render large number of TextInputs with key prop without a Runtime Error';
exports.examples = [
  {
    title: 'A list of TextInputs with key prop - Re-render every 3 seconds',
    description:
      'A list of TextInputs with key prop re-rendered every 3 seconds will trigger an NPE Runtime error.',
    render: function(): React.Node {
      return <TextInputKeyProp />;
    },
  },
];
