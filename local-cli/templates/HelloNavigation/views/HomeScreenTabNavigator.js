import React, { Component } from 'react';
import {
  ListView,
  Platform,
  Text,
} from 'react-native';
import { TabNavigator } from 'react-navigation';

import ChatListScreen from './chat/ChatListScreen';
import WelcomeScreen from './welcome/WelcomeScreen';

/**
 * Screen with tabs shown on app startup.
 */
const HomeScreenTabNavigator = TabNavigator({
  Welcome: {
    screen: WelcomeScreen,
  },
  Chats: {
    screen: ChatListScreen,
  },
});

export default HomeScreenTabNavigator;
