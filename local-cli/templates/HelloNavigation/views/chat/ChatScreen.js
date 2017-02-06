import React, { Component } from 'react';
import {
  Button,
  ListView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import KeyboardSpacer from '../../components/KeyboardSpacer';

export default class ChatScreen extends Component {

  static navigationOptions = {
    title: (navigation) => `Chat with ${navigation.state.params.name}`,
  }

  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    const messages = [
      {
        name: props.navigation.state.params.name,
        name: 'Claire',
        text: 'I ❤️ React Native!',
      },
    ];
    this.state = {
      messages: messages,
      dataSource: ds.cloneWithRows(messages),
      myMessage: '',
    }
  }

  addMessage = () => {
    this.setState((prevState) => {
      if (!prevState.myMessage) return prevState;
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
    this.refs.textInput.clear();
  }

  myMessageChange = (event) => {
    this.setState({myMessage: event.nativeEvent.text});
  }

  renderRow = (message) => (
    <View style={styles.bubble}>
      <Text style={styles.name}>{message.name}</Text>
      <Text>{message.text}</Text>
    </View>
  )

  render() {
    return (
      <View style={styles.container}>
        <ListView
          ref="listView"
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
          style={styles.listView}
          onLayout={this.scrollToBottom}
        />
        <View style={styles.composer}>
          <TextInput
            ref='textInput'
            style={styles.textInput}
            placeholder='Type a message...'
            text={this.state.myMessage}
            onSubmitEditing={this.addMessage}
            onChange={this.myMessageChange}
          />
          {this.state.myMessage !== '' && (
            <Button
              title="Send"
              onPress={this.addMessage}
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
    alignItems: 'flex-end',
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
