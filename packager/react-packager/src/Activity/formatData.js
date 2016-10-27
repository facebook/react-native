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

import type {Event} from './Types';

function getDataString(event: Event): string {
  const {options, data} = event;
  const {displayFields} = options;

  if (!Object.keys(data).length ||
    !(Array.isArray(displayFields) || displayFields === true)) {
    return '';
  }

  const fields = Array.isArray(displayFields) ? displayFields : Object.keys(data);
  const dataList = fields.map(field => {
    if (data[field] === undefined) {
      throw new Error(`"${field}" is not defined for event ""${event.name}"!`);
    }
    return `${field}: ${data[field].value.toString()}`;
  });

  let dataString = dataList.join(' | ');

  if (dataString) {
    dataString = `  ${dataString}  `;
  }

  return dataString;
}

module.exports = getDataString;
