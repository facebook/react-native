'use strict';

import React, { Component } from 'react';
import {
  ActivityIndicator,
  Button,
  ListView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import KeyboardSpacer from '../../components/KeyboardSpacer';
import Backend from '../../lib/Backend';

export default class ChatScreen extends Component {

  static navigationOptions = {
    title: (navigation) => `Chat with ${navigation.state.params.name}`,
  }

  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      messages: [],
      dataSource: ds,
      myMessage: '',
      isLoading: true,
    };
  }

  async componentDidMount() {
    let chat;
    try {
      chat = await Backend.fetchChat(this.props.navigation.state.params.name);
    } catch (err) {
      // Here we would handle the fact the request failed, e.g.
      // set state to display "Messages could not be loaded".
      // We should also check network connection first before making any
      // network requests - maybe we're offline? See React Native's NetInfo
      // module.
      this.setState({
        isLoading: false,
      });
      return;
    }
    this.setState((prevState) => ({
      messages: chat.messages,
      dataSource: prevState.dataSource.cloneWithRows(chat.messages),
      isLoading: false,
    }));
  }

  onAddMessage = async () => {
    // Optimistically update the UI
    this.addMessageLocal();
    // Send the request
    try {
      await Backend.sendMessage({
        name: this.props.navigation.state.params.name,
        // TODO Is reading state like this outside of setState OK?
        // Can it contain a stale value?
        message: this.state.myMessage,
      });
    } catch (err) {
      // Here we would handle the request failure, e.g. call setState
      // to display a visual hint showing the message could not be sent.
    }
  }

  addMessageLocal = () => {
    this.setState((prevState) => {
      if (!prevState.myMessage) {
        return prevState;
      }
      const messages = [
        ...prevState.messages, {
          name: 'Me',
          text: prevState.myMessage,
        }
      ];
      return {
        messages: messages,
        dataSource: prevState.dataSource.cloneWithRows(messages),
        myMessage: '',
      }
    });
    this.textInput.clear();
  }

  onMyMessageChange = (event) => {
    this.setState({myMessage: event.nativeEvent.text});
  }

  renderRow = (message) => (
    <View style={styles.bubble}>
      <Text style={styles.name}>{message.name}</Text>
      <Text>{message.text}</Text>
    </View>
  )

  render() {
    if (this.state.isLoading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
          style={styles.listView}
          onLayout={this.scrollToBottom}
        />
        <View style={styles.composer}>
          <TextInput
            ref={(textInput) => { this.textInput = textInput; }}
            style={styles.textInput}
            placeholder="Type a message..."
            text={this.state.myMessage}
            onSubmitEditing={this.onAddMessage}
            onChange={this.onMyMessageChange}
          />
          {this.state.myMessage !== '' && (
            <Button
              title="Send"
              onPress={this.onAddMessage}
            />
          )}
        </View>
        <KeyboardSpacer />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: 'white',
  },
  listView: {
    flex: 1,
    alignSelf: 'stretch',
  },
  bubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#d6f3fc',
    padding: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  name: {
    fontWeight: 'bold',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  textInput: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 4,
    height: 30,
    fontSize: 13,
    marginRight: 8,
  }
});
