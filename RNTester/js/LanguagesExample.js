/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule LanguagesExample
 */
'use strict';


var React = require('react');
var ReactNative = require('react-native');
var {
  Languages,
  Platform,
  Text,
} = ReactNative;

exports.framework = 'React';
exports.title = 'Languages';
exports.description = 'Device languages';

const examples = [
  {
    title: 'navigator.language',
    render: function(): React.Element<any> {
      return <Text>{navigator.language}</Text>;
    },
  },
  {
    title: 'navigator.languages',
    render: function(): React.Element<any> {
      return <Text>{JSON.stringify(navigator.languages)}</Text>;
    },
  },
];

if (Platform.OS === 'android') {
  examples.push({
    title: 'Languages change event listener',
    render: function(): React.Element<any> {
      return <Text>{`The current language is ${navigator.language}`}</Text>;
    },
  });

  Languages.addEventListener('change', () => {
    examples[2].render = function(): React.Element<any> {
      return <Text>{`Language has changed to ${navigator.language}`}</Text>;
    };
  });
}

exports.examples = examples;
