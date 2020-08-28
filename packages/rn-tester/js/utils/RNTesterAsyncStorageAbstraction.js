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

import {Platform, Linking} from 'react-native';
import {AsyncStorage} from 'react-native';
const RNTesterNavigationReducer = require('./RNTesterNavigationReducer');
const URIActionMap = require('./URIActionMap');
import type {RNTesterExample} from '../types/RNTesterTypes';

const APP_STATE_KEY = 'RNTesterAppState.v2';

type Context = $FlowFixMe;

export const initializeAsyncStore = (context: Context) => {
  Linking.getInitialURL().then(url => {
    AsyncStorage.getItem(APP_STATE_KEY, (err, storedString) => {
      const exampleAction = URIActionMap(
        context.props.exampleFromAppetizeParams,
      );
      const urlAction = URIActionMap(url);
      const launchAction = exampleAction || urlAction;
      if (err || !storedString) {
        const initialAction = launchAction || {type: 'RNTesterListAction'};
        context.setState(
          RNTesterNavigationReducer(context.state, initialAction),
        );
        return;
      }

      const storedState = JSON.parse(storedString);
      if (launchAction) {
        context.setState(RNTesterNavigationReducer(storedState, launchAction));
        return;
      }
      context.setState({
        openExample: storedState.openExample,
      });
    });
  });

  if (Platform.OS === 'ios') {
    Linking.addEventListener('url', url => {
      context._handleAction(URIActionMap(url));
    });
  }

  AsyncStorage.getItem('Components', (err, storedString) => {
    if (err || !storedString) {
      return;
    }
    const components = JSON.parse(storedString);
    context.setState({
      Components: components,
    });
  });
  AsyncStorage.getItem('Api', (err, storedString) => {
    if (err || !storedString) {
      return;
    }
    const api = JSON.parse(storedString);
    context.setState({
      Api: api,
    });
  });
  AsyncStorage.getItem('RecentComponents', (err, storedString) => {
    if (err || !storedString) {
      return;
    }
    const recentComponents = JSON.parse(storedString);
    context.setState({
      recentComponents: recentComponents,
    });
  });
  AsyncStorage.getItem('RecentApi', (err, storedString) => {
    if (err || !storedString) {
      return;
    }
    const recentApis = JSON.parse(storedString);
    context.setState({
      recentApis: recentApis,
    });
  });
};

export const addApi = (
  apiName: string,
  api: RNTesterExample,
  context: $FlowFixMe,
) => {
  const stateApi = Object.assign({}, context.state.Api);
  stateApi[apiName] = api;
  context.setState({
    Api: stateApi,
  });
  // Syncing the bookmarks over async storage
  AsyncStorage.setItem('Api', JSON.stringify(stateApi));
};

export const addComponent = (
  componentName: string,
  component: RNTesterExample,
  context: Context,
) => {
  const stateComponent = Object.assign({}, context.state.Components);
  stateComponent[componentName] = component;
  context.setState({
    Components: stateComponent,
  });
  // Syncing the bookmarks over async storage
  AsyncStorage.setItem('Components', JSON.stringify(stateComponent));
};

export const removeApi = (apiName: string, context: Context) => {
  const stateApi = Object.assign({}, context.state.Api);
  delete stateApi[apiName];
  context.setState({
    Api: stateApi,
  });
  AsyncStorage.setItem('Api', JSON.stringify(stateApi));
};

export const removeComponent = (componentName: string, context: Context) => {
  const stateComponent = Object.assign({}, context.state.Components);
  delete stateComponent[componentName];
  context.setState({
    Components: stateComponent,
  });
  AsyncStorage.setItem('Components', JSON.stringify(stateComponent));
};

export const checkBookmarks = (
  title: string,
  key: string,
  context: Context,
): boolean => {
  if (key === 'APIS' || key === 'RECENT_APIS') {
    return context.state.Api[title] === undefined;
  }
  return context.state.Components[title] === undefined;
};

export const updateRecentlyViewedList = (
  item: RNTesterExample,
  key: string,
  context: Context,
) => {
  const openedItem = item;
  if (key === 'COMPONENTS' || key === 'RECENT_COMPONENTS') {
    let componentsCopy = [...context.state.recentComponents];
    const ind = componentsCopy.findIndex(
      component => component.key === openedItem.key,
    );
    if (ind !== -1) {
      componentsCopy.splice(ind, 1);
    }
    if (context.state.recentComponents.length >= 5) {
      componentsCopy.pop();
    }
    componentsCopy.unshift(openedItem);
    context.setState({
      recentComponents: componentsCopy,
    });
    // Syncing the recently viewed components over async storage
    AsyncStorage.setItem('RecentComponents', JSON.stringify(componentsCopy));
  } else {
    let apisCopy = [...context.state.recentApis];
    const ind = apisCopy.findIndex(api => api.key === openedItem.key);
    if (ind !== -1) {
      apisCopy.splice(ind, 1);
    }
    if (context.state.recentApis.length >= 5) {
      apisCopy.pop();
    }
    apisCopy.unshift(openedItem);
    context.setState({
      recentApis: apisCopy,
    });
    // Syncing the recently viewed apis over async storage
    AsyncStorage.setItem('RecentApi', JSON.stringify(apisCopy));
  }
};
