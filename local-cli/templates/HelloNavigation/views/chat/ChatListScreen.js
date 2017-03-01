'use strict';

import React, { Component } from 'react';
import {
  ActivityIndicator,
  Image,
  ListView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import ListItem from '../../components/ListItem';
import Backend from '../../lib/Backend';

export default class ChatListScreen extends Component {

  static navigationOptions = {
    title: 'Chats',
    header: {
      visible: Platform.OS === 'ios',
    },
    tabBar: {
      icon: ({ tintColor }) => (
        <Image
          // Using react-native-vector-icons works here too
          source={require('./chat-icon.png')}
          style={[styles.icon, {tintColor: tintColor}]}
        />
      ),
    },
  }

  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      isLoading: true,
      dataSource: ds,
    };
  }

  async componentDidMount() {
    const chatList = await Backend.fetchChatList();
    this.setState((prevState) => ({
      dataSource: prevState.dataSource.cloneWithRows(chatList),
      isLoading: false,
    }));
  }

  // Binding the function so it can be passed to ListView below
  // and 'this' works properly inside renderRow
  renderRow = (name) => {
    return (
      <ListItem
        label={name}
        onPress={() => {
          // Start fetching in parallel with animating
          this.props.navigation.navigate('Chat', {
            name: name,
          });
        }}
      />
    );
  }

  render() {
    if (this.state.isLoading) {
      return (
        <View style={styles.loadingScreen}>
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
        style={styles.listView}
      />
    );
  }
}

const styles = StyleSheet.create({
  loadingScreen: {
    backgroundColor: 'white',
    paddingTop: 8,
    flex: 1,
  },
  listView: {
    backgroundColor: 'white',
  },
  icon: {
    width: 30,
    height: 26,
  },
});
