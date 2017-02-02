import React, { Component } from 'react';
import {
  ListView,
  Platform,
  Text,
} from 'react-native';
import { TabNavigator } from 'react-navigation';

import ChatListScreen from './chat/ChatListScreen';
import FriendListScreen from './friends/FriendListScreen';

/**
 * Screen with tabs shown on app startup.
 */
const HomeScreenTabNavigator = TabNavigator({
  Chats: {
    screen: ChatListScreen,
  },
  Friends: {
    screen: FriendListScreen,
  },
});

export default HomeScreenTabNavigator;
