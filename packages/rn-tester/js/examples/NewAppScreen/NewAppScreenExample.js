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
const {View} = require('react-native');
const {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} = require('react-native/Libraries/NewAppScreen');

exports.title = 'New App Screen';
exports.description = 'Displays the content of the new app screen';
exports.examples = [
  {
    title: 'New App Screen Header',
    description: 'Displays a welcome to building a React Native app',
    render(): React.MixedElement {
      return (
        <View style={{overflow: 'hidden'}}>
          <Header />
        </View>
      );
    },
  },
  {
    title: 'Learn More Links',
    description:
      'Learn more about the tools and techniques for building React Native apps.',
    render(): React.MixedElement {
      return <LearnMoreLinks />;
    },
  },
  {
    title: 'New App Screen Colors',
    description: 'Consistent colors to use throughout the new app screen.',
    render(): React.MixedElement {
      return (
        <View style={{flexDirection: 'row'}}>
          {Object.keys(Colors).map(key => (
            <View
              key={`color-${key}`}
              style={{width: 50, height: 50, backgroundColor: Colors[key]}}
            />
          ))}
        </View>
      );
    },
  },
  {
    title: 'Debug Instructions',
    description:
      'Platform-specific instructions on how to start debugging a React Native app.',
    render(): React.MixedElement {
      return <DebugInstructions />;
    },
  },
  {
    title: 'Reload Instructions',
    description:
      'Platform-specific instructions on how to reload a React Native app.',
    render(): React.MixedElement {
      return <ReloadInstructions />;
    },
  },
];
