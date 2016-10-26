/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */
'use strict';

import type {EventData, NormalisedEventData} from './Types';

function normaliseEventData(eventData: EventData): NormalisedEventData {
  if (!eventData) {
    return {};
  }

  const normalisedEventData = {};

  Object.keys(eventData).forEach(field => {
    const value = eventData[field];
    let type;

    if (typeof value === 'string' || typeof value === 'boolean') {
      type = 'normal';
    } else if (typeof value === 'number') {
      type = 'int';
    } else {
      throw new Error(`Disallowed value for event field "${field}""!`);
    }

    normalisedEventData[field] = {type, value};
  });

  return normalisedEventData;
}

module.exports = normaliseEventData;
