/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule TVEventHandlerExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');

var {
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TVEventHandler,
} = ReactNative;

exports.framework = 'React';
exports.title = 'TVEventHandler example';
exports.description = 'iOS alerts and action sheets';
exports.examples = [{
  title: 'TVEventHandler',
  render() {return <TVEventHandlerView/>;}
}];

class TVEventHandlerView extends React.Component<$FlowFixMeProps, {
  lastEventType: string
}> {
  constructor(props) {
    super(props);
    this.state = {
      lastEventType: ''
    };
  }

  _tvEventHandler: any;

  _enableTVEventHandler() {
    this._tvEventHandler = new TVEventHandler();
    this._tvEventHandler.enable(this, function(cmp, evt) {
      cmp.setState({
        lastEventType: evt.eventType
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

    if (Platform.isTVOS) {
      return (
        <View>
          <TouchableOpacity onPress={() => {}}>
          <Text>
            This example enables an instance of TVEventHandler to show the last event detected from the Apple TV Siri remote or from a keyboard.
          </Text>
          </TouchableOpacity>
          <Text style={{color: 'blue'}}>
            {this.state.lastEventType}
          </Text>
        </View>
      );
    } else {
      return (
        <View>
          <Text>
            This example is intended to be run on Apple TV.
          </Text>
        </View>
      );
    }
  }
}
