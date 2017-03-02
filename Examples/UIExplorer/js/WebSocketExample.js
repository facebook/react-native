/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 * @providesModule WebSocketExample
 */
'use strict';

/* eslint-env browser */

const React = require('react');
const ReactNative = require('react-native');
const {
  PixelRatio,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
} = ReactNative;

const DEFAULT_WS_URL = 'ws://localhost:5555/';
const DEFAULT_HTTP_URL = 'http://localhost:5556/';
const WS_EVENTS = [
  'close',
  'error',
  'message',
  'open',
];
const WS_STATES = [
  /* 0 */ 'CONNECTING',
  /* 1 */ 'OPEN',
  /* 2 */ 'CLOSING',
  /* 3 */ 'CLOSED',
];

class Button extends React.Component {
  render(): React.Element<any> {
    const label = <Text style={styles.buttonLabel}>{this.props.label}</Text>;
    if (this.props.disabled) {
      return (
        <View style={[styles.button, styles.disabledButton]}>
          {label}
        </View>
      );
    }
    return (
      <TouchableOpacity
        onPress={this.props.onPress}
        style={styles.button}>
        {label}
      </TouchableOpacity>
    );
  }
}

class Row extends React.Component {
  render(): React.Element<any> {
    return (
      <View style={styles.row}>
        <Text>{this.props.label}</Text>
        <Text>{this.props.value}</Text>
      </View>
    );
  }
}

function showValue(value) {
  if (value === undefined || value === null) {
    return '(no value)';
  }
  console.log('typeof Uint8Array', typeof Uint8Array);
  if (typeof ArrayBuffer !== 'undefined' &&
      typeof Uint8Array !== 'undefined' &&
      value instanceof ArrayBuffer) {
    return `ArrayBuffer {${String(Array.from(new Uint8Array(value)))}}`;
  }
  return value;
}

type State = {
  url: string;
  httpUrl: string;
  fetchStatus: ?string;
  socket: ?WebSocket;
  socketState: ?number;
  lastSocketEvent: ?string;
  lastMessage: ?string | ?ArrayBuffer;
  outgoingMessage: string;
};

class WebSocketExample extends React.Component<any, any, State> {

  static title = 'WebSocket';
  static description = 'WebSocket API';

  state: State = {
    url: DEFAULT_WS_URL,
    httpUrl: DEFAULT_HTTP_URL,
    fetchStatus: null,
    socket: null,
    socketState: null,
    lastSocketEvent: null,
    lastMessage: null,
    outgoingMessage: '',
  };

  _connect = () => {
    const socket = new WebSocket(this.state.url);
    WS_EVENTS.forEach(ev => socket.addEventListener(ev, this._onSocketEvent));
    this.setState({
      socket,
      socketState: socket.readyState,
    });
  };

  _disconnect = () => {
    if (!this.state.socket) {
      return;
    }
    this.state.socket.close();
  };

  // Ideally this would be a MessageEvent, but Flow's definition
  // doesn't inherit from Event, so it's 'any' for now.
  // See https://github.com/facebook/flow/issues/1654.
  _onSocketEvent = (event: any) => {
    const state: any = {
      socketState: event.target.readyState,
      lastSocketEvent: event.type,
    };
    if (event.type === 'message') {
      state.lastMessage = event.data;
    }
    this.setState(state);
  };

  _sendText = () => {
    if (!this.state.socket) {
      return;
    }
    this.state.socket.send(this.state.outgoingMessage);
    this.setState({outgoingMessage: ''});
  };

  _sendHttp = () => {
    this.setState({
      fetchStatus: 'fetching',
    });
    fetch(this.state.httpUrl).then((response) => {
      if (response.status >= 200 && response.status < 400) {
        this.setState({
          fetchStatus: 'OK',
        });
      }
    });
  };

  _sendBinary = () => {
    if (!this.state.socket ||
        typeof ArrayBuffer === 'undefined' ||
        typeof Uint8Array === 'undefined') {
      return;
    }
    const {outgoingMessage} = this.state;
    const buffer = new Uint8Array(outgoingMessage.length);
    for (let i = 0; i < outgoingMessage.length; i++) {
      buffer[i] = outgoingMessage.charCodeAt(i);
    }
    this.state.socket.send(buffer);
    this.setState({outgoingMessage: ''});
  };

  render(): React.Element<any> {
    const socketState = WS_STATES[this.state.socketState || -1];
    const canConnect =
      !this.state.socket ||
      this.state.socket.readyState >= WebSocket.CLOSING;
    const canSend = !!this.state.socket;
    return (
      <ScrollView style={styles.container}>
        <View style={styles.note}>
          <Text>To start the WS test server:</Text>
          <Text style={styles.monospace}>
            ./Examples/UIExplorer/js/websocket_test_server.js
          </Text>
        </View>
        <Row
          label="Current WebSocket state"
          value={showValue(socketState)}
        />
        <Row
          label="Last WebSocket event"
          value={showValue(this.state.lastSocketEvent)}
        />
        <Row
          label="Last message received"
          value={showValue(this.state.lastMessage)}
        />
        <TextInput
          style={styles.textInput}
          autoCorrect={false}
          placeholder="Server URL..."
          onChangeText={(url) => this.setState({url})}
          value={this.state.url}
        />
        <View style={styles.buttonRow}>
          <Button
            onPress={this._connect}
            label="Connect"
            disabled={!canConnect}
          />
          <Button
            onPress={this._disconnect}
            label="Disconnect"
            disabled={canConnect}
          />
        </View>
        <TextInput
          style={styles.textInput}
          autoCorrect={false}
          placeholder="Type message here..."
          onChangeText={(outgoingMessage) => this.setState({outgoingMessage})}
          value={this.state.outgoingMessage}
        />
        <View style={styles.buttonRow}>
          <Button
            onPress={this._sendText}
            label="Send as text"
            disabled={!canSend}
          />
          <Button
            onPress={this._sendBinary}
            label="Send as binary"
            disabled={!canSend}
          />
        </View>
        <View style={styles.note}>
          <Text>To start the HTTP test server:</Text>
          <Text style={styles.monospace}>
            ./Examples/UIExplorer/http_test_server.js
          </Text>
        </View>
        <TextInput
          style={styles.textInput}
          autoCorrect={false}
          placeholder="HTTP URL..."
          onChangeText={(httpUrl) => this.setState({httpUrl})}
          value={this.state.httpUrl}
        />
        <View style={styles.buttonRow}>
          <Button
            onPress={this._sendHttp}
            label="Send HTTP request to set cookie"
            disabled={this.state.fetchStatus === 'fetching'}
          />
        </View>
        <View style={styles.note}>
          <Text>
            {this.state.fetchStatus === 'OK' ? 'Done. Check your WS server console to see if the next WS requests include the cookie (should be "wstest=OK")' : '-'}
          </Text>
        </View>
      </ScrollView>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  note: {
    padding: 8,
    margin: 4,
    backgroundColor: 'white',
  },
  monospace: {
    fontFamily: 'courier',
    fontSize: 11,
  },
  row: {
    height: 40,
    padding: 4,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1 / PixelRatio.get(),
    borderColor: 'grey',
  },
  button: {
    margin: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'blue',
    alignSelf: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  textInput: {
    height: 40,
    backgroundColor: 'white',
    margin: 8,
    padding: 8,
  },
});

module.exports = WebSocketExample;
