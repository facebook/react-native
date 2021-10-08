/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// TODO: Remove this module when the import is removed from the React renderers.

// This module is used by React to initialize the React Native runtime,
// but it is now a no-op.

// This is redundant because all React Native apps are already executing
// `InitializeCore` before the entrypoint of the JS bundle
// (see https://github.com/react-native-community/cli/blob/e1da64317a1178c2b262d82c2f14210cdfa3ebe1/packages/cli-plugin-metro/src/tools/loadMetroConfig.ts#L93)
// and importing it unconditionally from React only prevents users from
// customizing what they want to include in their apps (re: app size).
