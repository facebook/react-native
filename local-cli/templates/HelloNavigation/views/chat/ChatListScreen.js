/** @format */

import React, {Component} from 'react';
import {
  ActivityIndicator,
  Image,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import ListItem from '../../components/ListItem';
import Backend from '../../lib/Backend';

export default class ChatListScreen extends Component {
  static navigationOptions = {
    title: 'Chats',
    header: Platform.OS === 'ios' ? undefined : null,
    tabBarIcon: ({tintColor}) => (
      <Image
        // Using react-native-vector-icons works here too
        source={require('./chat-icon.png')}
        style={[styles.icon, {tintColor: tintColor}]}
      />
    ),
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
    };
  }

  async componentDidMount() {
    const chatList = await Backend.fetchChatList();
    this.setState(prevState => ({
      chatList,
      isLoading: false,
    }));
  }

  // Binding the function so it can be passed to FlatList below
  // and 'this' works properly inside renderItem
  renderItem = ({item}) => {
    return (
      <ListItem
        label={item}
        onPress={() => {
          // Start fetching in parallel with animating
          this.props.navigation.navigate('Chat', {
            name: item,
          });
        }}
      />
    );
  };

  render() {
    if (this.state.isLoading) {
      return (
        <View style={styles.loadingScreen}>
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <FlatList
        data={this.state.chatList}
        renderItem={this.renderItem}
        keyExtractor={(item, index) => index}
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
