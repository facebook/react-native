/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFeatureFlags
 */

'use strict';

const ReactFeatureFlags = {
  debugRenderPhaseSideEffects: false,
  // TODO (T25573762) Hook this up to a GK for Facaebook engineers (DEV + prod).
  debugRenderPhaseSideEffectsForStrictMode: true,
  // TODO (T25573607) Enable this warning once deprecation codemod has been run.
  warnAboutDeprecatedLifecycles: false,
};

module.exports = ReactFeatureFlags;
