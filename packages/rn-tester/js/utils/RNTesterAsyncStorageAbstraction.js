/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * context source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of context source tree.
 *
 * @format
 * @flow
 */

'use strict';

import {Platform, Linking} from 'react-native';
import {AsyncStorage} from 'react-native';
const RNTesterNavigationReducer = require('./RNTesterNavigationReducer');
const URIActionMap = require('./URIActionMap');

const APP_STATE_KEY = 'RNTesterAppState.v2';

export const initializeAsyncStore = (context) => {
    Linking.getInitialURL().then(url => {
        AsyncStorage.getItem(APP_STATE_KEY, (err, storedString) => {
          const exampleAction = URIActionMap(
            context.props.exampleFromAppetizeParams,
          );
          const urlAction = URIActionMap(url);
          const launchAction = exampleAction || urlAction;
          if (err || !storedString) {
            const initialAction = launchAction || {type: 'RNTesterListAction'};
            context.setState(RNTesterNavigationReducer(null, initialAction));
            return;
          }

          const storedState = JSON.parse(storedString)
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
};

export const addApi = (apiName, api, context) => {
    const stateApi = Object.assign({}, context.state.Api);
    stateApi[apiName] = api;
    context.setState({
      Api: stateApi,
    });
    // Syncing the bookmarks over async storage
    AsyncStorage.setItem('Api', JSON.stringify(stateApi));
}

export const addComponent = (componentName, component, context) => {
    const stateComponent = Object.assign({}, context.state.Components);
    stateComponent[componentName] = component;
    context.setState({
      Components: stateComponent,
    });
    // Syncing the bookmarks over async storage
    AsyncStorage.setItem('Components', JSON.stringify(stateComponent));
}

export const removeApi = (apiName, context) => {
    const stateApi = Object.assign({}, context.state.Api);
    delete stateApi[apiName];
    context.setState({
      Api: stateApi,
    });
    AsyncStorage.setItem('Api', JSON.stringify(stateApi));
}

export const removeComponent = (componentName, context) => {
  const stateComponent = Object.assign({}, context.state.Components);
  delete stateComponent[componentName];
  context.setState({
    Components: stateComponent,
  });
  AsyncStorage.setItem('Components', JSON.stringify(stateComponent));
}

export const checkBookmarks = (title, key, context) => {
  if (key === 'APIS' || key === 'RECENT_APIS') {
    return context.state.Api[title] === undefined;
  }
  return context.state.Components[title] === undefined;
}
