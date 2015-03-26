/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule diffRawProperties
 * @flow
 */
'use strict';

/**
 * diffRawProperties takes two sets of props and a set of valid attributes
 * and write to updatePayload the values that changed or were deleted
 *
 * @param {?object} updatePayload Overriden with the props that changed.
 * @param {!object} prevProps Previous properties to diff against current
 * properties. These properties are as supplied to component construction.
 * @param {!object} prevProps Next "current" properties to diff against
 * previous. These properties are as supplied to component construction.
 * @return {?object}
 */
function diffRawProperties(
  updatePayload: ?Object,
  prevProps: ?Object,
  nextProps: ?Object,
  validAttributes: Object
): ?Object {
  var validAttributeConfig;
  var nextProp;
  var prevProp;
  var isScalar;
  var shouldUpdate;

  if (nextProps) {
    for (var propKey in nextProps) {
      validAttributeConfig = validAttributes[propKey];
      if (!validAttributeConfig) {
        continue; // not a valid native prop
      }
      prevProp = prevProps && prevProps[propKey];
      nextProp = nextProps[propKey];
      if (prevProp !== nextProp) {
        // If you want a property's diff to be detected, you must configure it
        // to be so - *or* it must be a scalar property. For now, we'll allow
        // creation with any attribute that is not scalar, but we should
        // eventually even reject those unless they are properly configured.
        isScalar = typeof nextProp !== 'object' || nextProp === null;
        shouldUpdate = isScalar ||
          !prevProp ||
          validAttributeConfig.diff &&
          validAttributeConfig.diff(prevProp, nextProp);

        if (shouldUpdate) {
          updatePayload = updatePayload || {};
          updatePayload[propKey] = nextProp;
        }
      }
    }
  }

  // Also iterate through all the previous props to catch any that have been
  // removed and make sure native gets the signal so it can reset them to the
  // default.
  if (prevProps) {
    for (var propKey in prevProps) {
      validAttributeConfig = validAttributes[propKey];
      if (!validAttributeConfig) {
        continue; // not a valid native prop
      }
      if (updatePayload && updatePayload[propKey] !== undefined) {
        continue; // Prop already specified
      }
      prevProp = prevProps[propKey];
      nextProp = nextProps && nextProps[propKey];
      if (prevProp !== nextProp) {
        if (nextProp === undefined) {
          nextProp = null; // null is a sentinel we explicitly send to native
        }
        // If you want a property's diff to be detected, you must configure it
        // to be so - *or* it must be a scalar property. For now, we'll allow
        // creation with any attribute that is not scalar, but we should
        // eventually even reject those unless they are properly configured.
        isScalar = typeof nextProp !== 'object' || nextProp === null;
        shouldUpdate = isScalar && prevProp !== nextProp ||
          validAttributeConfig.diff &&
          validAttributeConfig.diff(prevProp, nextProp);
        if (shouldUpdate) {
          updatePayload = updatePayload || {};
          updatePayload[propKey] = nextProp;
        }
      }
    }
  }
  return updatePayload;
}

module.exports = diffRawProperties;
