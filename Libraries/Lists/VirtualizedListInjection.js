/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import * as React from 'react';
import type VirtualizedList from './VirtualizedList';
import type {Props as VirtualizedListProps} from './VirtualizedListProps';
import invariant from 'invariant';

export type ListImplementation = React.ComponentType<VirtualizedListProps> &
  interface {};

/**
 * Global override to the VirtualizedList implementation used when imported
 */
let injection: ?ListImplementation;
let retrieved = false;

export function inject(listImplementation: ListImplementation): void {
  invariant(
    !retrieved,
    'VirtualizedListInjection.inject() called after the injection was already retrieved',
  );
  injection = listImplementation;
}

export function getOrDefault(
  defaultImplementation: Class<VirtualizedList>,
): Class<VirtualizedList> {
  retrieved = true;
  return injection
    ? verifyVirtualizedList(injection, defaultImplementation)
    : defaultImplementation;
}

function verifyVirtualizedList(
  injectedImplementation: ListImplementation,
  defaultImplementation: Class<VirtualizedList>,
): Class<VirtualizedList> {
  // The original VirtualizedList marks method as "private by convention" by
  // prefixing with underscore. These methods may still be called at runtime
  // by tests or other internals, so they cannot be truly private, and will be
  // included in the Flow type of VirtualizedList.
  // Allow the injection to have different private methods by allowing a loose
  // Flow type, but check at runtime that the set of public properties matches.
  if (__DEV__) {
    for (const field of Object.keys(defaultImplementation)) {
      if (isPublicField(field)) {
        invariant(
          injectedImplementation.hasOwnProperty(field),
          `VirtualizedList injection missing field: "${field}"`,
        );
      }
    }
  }

  // $FlowExpectedError
  return injectedImplementation;
}

function isPublicField(fieldName: string): boolean {
  // Respect JSTransform public methods by double underscore (D33982339)
  return fieldName.length > 0 && (fieldName[0] !== '_' || fieldName[1] === '_');
}
