import React, { Component } from 'react';
import {
  Image,
  ListView,
  Platform,
  StyleSheet,
} from 'react-native';
import ListItem from '../../components/ListItem';

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
      dataSource: ds.cloneWithRows([
        'Claire', 'John'
      ])
    };
  }

  // Binding the function so it can be passed to ListView below
  // and 'this' works properly inside _renderRow
  _renderRow = (name) => {
    return (
      <ListItem
        label={name}
        onPress={() => this.props.navigation.navigate('Chat', {name: name})}
      />
    )
  }

  render() {
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this._renderRow}
        style={styles.listView}
      />
    );
  }
}

const styles = StyleSheet.create({
  listView: {
    backgroundColor: 'white',
  },
  icon: {
    width: 30,
    height: 26,
  },
});
