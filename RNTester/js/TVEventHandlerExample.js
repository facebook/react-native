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
const ReactNative = require('react-native');

const {Platform, View, Text, TouchableOpacity, TVEventHandler} = ReactNative;

type Props = $ReadOnly<{||}>;
type State = {|lastEventType: string|};
class TVEventHandlerView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      lastEventType: '',
    };
  }

  _tvEventHandler: any;

  _enableTVEventHandler() {
    this._tvEventHandler = new TVEventHandler();
    this._tvEventHandler.enable(this, function(cmp, evt) {
      cmp.setState({
        lastEventType: evt.eventType,
      });
    });
  }

  _disableTVEventHandler() {
    if (this._tvEventHandler) {
      this._tvEventHandler.disable();
      delete this._tvEventHandler;
    }
  }

  componentDidMount() {
    this._enableTVEventHandler();
  }

  componentWillUnmount() {
    this._disableTVEventHandler();
  }

  render() {
    if (Platform.isTV) {
      return (
        <View>
          <TouchableOpacity onPress={() => {}}>
            <Text>
              This example enables an instance of TVEventHandler to show the
              last event detected from the Apple TV Siri remote or from a
              keyboard.
            </Text>
          </TouchableOpacity>
          <Text style={{color: 'blue'}}>{this.state.lastEventType}</Text>
        </View>
      );
    } else {
      return (
        <View>
          <Text>This example is intended to be run on Apple TV.</Text>
        </View>
      );
    }
  }
}

exports.framework = 'React';
exports.title = 'TVEventHandler example';
exports.description = 'iOS alerts and action sheets';
exports.examples = [
  {
    title: 'TVEventHandler',
    render() {
      return <TVEventHandlerView />;
    },
  },
];
