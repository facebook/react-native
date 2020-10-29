/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {GeneratedViewConfig} from '../../Utilities/registerGeneratedViewConfig';

const AndroidDialogPickerViewConfig = {
  uiViewClassName: 'AndroidDialogPicker',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    color: {process: require('../../StyleSheet/processColor')},
    backgroundColor: {process: require('../../StyleSheet/processColor')},
    enabled: true,
    items: true,
    prompt: true,
    selected: true,
    onSelect: true,
  },
};

module.exports = (AndroidDialogPickerViewConfig: GeneratedViewConfig);
