/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {name as appName} from './app.json';
import App from './SectionProps';
import {AppRegistry} from 'react-native';

AppRegistry.registerComponent(appName, () => App);
