/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// [macOS]

import type {PartialViewConfigWithoutName} from './PlatformBaseViewConfig';

/* $FlowFixMe allow macOS to share iOS file */
import PlatformBaseViewConfigIos from './BaseViewConfig.ios';
import {ConditionallyIgnoredEventHandlers} from './ViewConfigIgnore';

const bubblingEventTypes = {
  ...PlatformBaseViewConfigIos.bubblingEventTypes,
};

const directEventTypes = {
  ...PlatformBaseViewConfigIos.directEventTypes,
  topDragEnter: {
    registrationName: 'onDragEnter',
  },
  topDragLeave: {
    registrationName: 'onDragLeave',
  },
  topDrop: {
    registrationName: 'onDrop',
  },
  topKeyUp: {
    registrationName: 'onKeyUp',
  },
  topKeyDown: {
    registrationName: 'onKeyDown',
  },
  topMouseEnter: {
    registrationName: 'onMouseEnter',
  },
  topMouseLeave: {
    registrationName: 'onMouseLeave',
  },
};

const validAttributesForNonEventProps = {
  acceptsFirstMouse: true,
  accessibilityTraits: true,
  allowsVibrancy: true,
  cursor: true,
  draggedTypes: true,
  enableFocusRing: true,
  tooltip: true,
  passthroughAllKeyEvents: true,
  validKeysDown: true,
  validKeysUp: true,
  mouseDownCanMoveWindow: true,
};

// Props for bubbling and direct events
const validAttributesForEventProps = ConditionallyIgnoredEventHandlers({
  onBlur: true,
  onDragEnter: true,
  onDragLeave: true,
  onDrop: true,
  onFocus: true,
  onKeyDown: true,
  onKeyUp: true,
  onMouseEnter: true,
  onMouseLeave: true,
});

/**
 * On macOS, view managers define all of a component's props.
 * All view managers extend RCTViewManager, and RCTViewManager declares these props.
 */
const PlatformBaseViewConfigMacOS: PartialViewConfigWithoutName = {
  bubblingEventTypes,
  directEventTypes,
  validAttributes: {
    ...PlatformBaseViewConfigIos.validAttributes,
    ...validAttributesForNonEventProps,
    ...validAttributesForEventProps,
  },
};

export default PlatformBaseViewConfigMacOS;
