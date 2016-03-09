/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeAttributePayload
 * @flow
 */
'use strict';

var Platform = require('Platform');

var deepDiffer = require('deepDiffer');
var styleDiffer = require('styleDiffer');
var flattenStyle = require('flattenStyle');

type AttributeDiffer = (prevProp : mixed, nextProp : mixed) => boolean;
type AttributePreprocessor = (nextProp: mixed) => mixed;

type CustomAttributeConfiguration =
  { diff : AttributeDiffer, process : AttributePreprocessor } |
  { diff : AttributeDiffer } |
  { process : AttributePreprocessor };

type AttributeConfiguration =
  { [key : string]: (
    CustomAttributeConfiguration | AttributeConfiguration /*| boolean*/
  ) };

function translateKey(propKey : string) : string {
  if (propKey === 'transform') {
    // We currently special case the key for `transform`. iOS uses the
    // transformMatrix name and Android uses the decomposedMatrix name.
    // TODO: We could unify these names and just use the name `transform`
    // all the time. Just need to update the native side.
    if (Platform.OS === 'android') {
      return 'decomposedMatrix';
    } else {
      return 'transformMatrix';
    }
  }
  return propKey;
}

function defaultDiffer(prevProp: mixed, nextProp: mixed) : boolean {
  if (typeof nextProp !== 'object' || nextProp === null) {
    // Scalars have already been checked for equality
    return true;
  } else {
    // For objects and arrays, the default diffing algorithm is a deep compare
    return deepDiffer(prevProp, nextProp);
  }
}

function diffNestedProperty(
  updatePayload :? Object,
  prevProp, // inferred
  nextProp, // inferred
  validAttributes : AttributeConfiguration
) : ?Object {
  // The style property is a deeply nested element which includes numbers
  // to represent static objects. Most of the time, it doesn't change across
  // renders, so it's faster to spend the time checking if it is different
  // before actually doing the expensive flattening operation in order to
  // compute the diff.
  if (!styleDiffer(prevProp, nextProp)) {
    return updatePayload;
  }

  // TODO: Walk both props in parallel instead of flattening.

  var previousFlattenedStyle = flattenStyle(prevProp);
  var nextFlattenedStyle = flattenStyle(nextProp);

  if (!previousFlattenedStyle || !nextFlattenedStyle) {
    if (nextFlattenedStyle) {
      return addProperties(
        updatePayload,
        nextFlattenedStyle,
        validAttributes
      );
    }
    if (previousFlattenedStyle) {
      return clearProperties(
        updatePayload,
        previousFlattenedStyle,
        validAttributes
      );
    }
    return updatePayload;
  }

  // recurse
  return diffProperties(
    updatePayload,
    previousFlattenedStyle,
    nextFlattenedStyle,
    validAttributes
  );
}

/**
 * addNestedProperty takes a single set of props and valid attribute
 * attribute configurations. It processes each prop and adds it to the
 * updatePayload.
 */
/*
function addNestedProperty(
  updatePayload :? Object,
  nextProp : Object,
  validAttributes : AttributeConfiguration
) {
  // TODO: Fast path
  return diffNestedProperty(updatePayload, {}, nextProp, validAttributes);
}
*/

/**
 * clearNestedProperty takes a single set of props and valid attributes. It
 * adds a null sentinel to the updatePayload, for each prop key.
 */
function clearNestedProperty(
  updatePayload :? Object,
  prevProp : Object,
  validAttributes : AttributeConfiguration
) : ?Object {
  // TODO: Fast path
  return diffNestedProperty(updatePayload, prevProp, {}, validAttributes);
}

/**
 * diffProperties takes two sets of props and a set of valid attributes
 * and write to updatePayload the values that changed or were deleted.
 * If no updatePayload is provided, a new one is created and returned if
 * anything changed.
 */
function diffProperties(
  updatePayload : ?Object,
  prevProps : Object,
  nextProps : Object,
  validAttributes : AttributeConfiguration
): ?Object {
  var attributeConfig : ?(CustomAttributeConfiguration | AttributeConfiguration);
  var nextProp;
  var prevProp;

  for (var propKey in nextProps) {
    attributeConfig = validAttributes[propKey];
    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    var altKey = translateKey(propKey);
    if (!validAttributes[altKey]) {
      // If there is no config for the alternative, bail out. Helps ART.
      altKey = propKey;
    }

    if (updatePayload && updatePayload[altKey] !== undefined) {
      // If we're in a nested attribute set, we may have set this property
      // already. If so, bail out. The previous update is what counts.
      continue;
    }
    prevProp = prevProps[propKey];
    nextProp = nextProps[propKey];

    // functions are converted to booleans as markers that the associated
    // events should be sent from native.
    if (typeof nextProp === 'function') {
      nextProp = true;
      // If nextProp is not a function, then don't bother changing prevProp
      // since nextProp will win and go into the updatePayload regardless.
      if (typeof prevProp === 'function') {
        prevProp = true;
      }
    }

    if (prevProp === nextProp) {
      continue; // nothing changed
    }

    // Pattern match on: attributeConfig
    if (typeof attributeConfig !== 'object') {
      // case: !Object is the default case
      if (defaultDiffer(prevProp, nextProp)) {
        // a normal leaf has changed
        (updatePayload || (updatePayload = {}))[altKey] = nextProp;
      }
    } else if (typeof attributeConfig.diff === 'function' ||
               typeof attributeConfig.process === 'function') {
      // case: CustomAttributeConfiguration
      var shouldUpdate = prevProp === undefined || (
        typeof attributeConfig.diff === 'function' ?
        attributeConfig.diff(prevProp, nextProp) :
        defaultDiffer(prevProp, nextProp)
      );
      if (shouldUpdate) {
        var nextValue = typeof attributeConfig.process === 'function' ?
                        attributeConfig.process(nextProp) :
                        nextProp;
        (updatePayload || (updatePayload = {}))[altKey] = nextValue;
      }
    } else {
      // default: fallthrough case when nested properties are defined
      updatePayload = diffNestedProperty(
        updatePayload,
        prevProp,
        nextProp,
        attributeConfig
      );
    }
  }

  // Also iterate through all the previous props to catch any that have been
  // removed and make sure native gets the signal so it can reset them to the
  // default.
  for (var propKey in prevProps) {
    if (nextProps[propKey] !== undefined) {
      continue; // we've already covered this key in the previous pass
    }
    attributeConfig = validAttributes[propKey];
    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    prevProp = prevProps[propKey];
    if (prevProp === undefined) {
      continue; // was already empty anyway
    }
    // Pattern match on: attributeConfig
    if (typeof attributeConfig !== 'object' ||
        typeof attributeConfig.diff === 'function' ||
        typeof attributeConfig.process === 'function') {

      // case: CustomAttributeConfiguration | !Object
      // Flag the leaf property for removal by sending a sentinel.
      (updatePayload || (updatePayload = {}))[translateKey(propKey)] = null;
    } else {
      // default:
      // This is a nested attribute configuration where all the properties
      // were removed so we need to go through and clear out all of them.
      updatePayload = clearNestedProperty(
        updatePayload,
        prevProp,
        attributeConfig
      );
    }
  }
  return updatePayload;
}

/**
 * addProperties adds all the valid props to the payload after being processed.
 */
function addProperties(
  updatePayload : ?Object,
  props : Object,
  validAttributes : AttributeConfiguration
) : ?Object {
  return diffProperties(updatePayload, {}, props, validAttributes);
}

/**
 * clearProperties clears all the previous props by adding a null sentinel
 * to the payload for each valid key.
 */
function clearProperties(
  updatePayload : ?Object,
  prevProps : Object,
  validAttributes : AttributeConfiguration
) :? Object {
  return diffProperties(updatePayload, prevProps, {}, validAttributes);
}

var ReactNativeAttributePayload = {

  create: function(
    props : Object,
    validAttributes : AttributeConfiguration
  ) : ?Object {
    return addProperties(
      null, // updatePayload
      props,
      validAttributes
    );
  },

  diff: function(
    prevProps : Object,
    nextProps : Object,
    validAttributes : AttributeConfiguration
  ) : ?Object {
    return diffProperties(
      null, // updatePayload
      prevProps,
      nextProps,
      validAttributes
    );
  }

};

module.exports = ReactNativeAttributePayload;
