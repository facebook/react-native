/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import App from './App';
import {name as appName} from './app.json';
import {AppRegistry} from 'react-native';

AppRegistry.registerComponent(appName, () => App);
