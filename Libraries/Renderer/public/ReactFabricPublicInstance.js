/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

export function isPublicInstance(maybeInstance: mixed): boolean {
  return (
    maybeInstance != null &&
    // TODO: implement a better check (maybe using instanceof) when the instance is defined in the React Native repository.
    (maybeInstance.__nativeTag != null ||
      // TODO: remove this check when syncing the new version of the renderer from React to React Native.
      isLegacyFabricInstance(maybeInstance))
  );
}

function isLegacyFabricInstance(maybeInstance: mixed): boolean {
  /* eslint-disable dot-notation */
  return (
    maybeInstance != null &&
    // $FlowExpectedError[incompatible-use]
    maybeInstance['_internalInstanceHandle'] != null &&
    maybeInstance['_internalInstanceHandle'].stateNode != null &&
    maybeInstance['_internalInstanceHandle'].stateNode.canonical != null
  );
}
