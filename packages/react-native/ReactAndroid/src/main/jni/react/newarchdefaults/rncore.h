/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <FBReactNativeSpec.h>

#warning \
    "[DEPRECATION] `rncore.h` is deprecated and will be removed in the future. \
    If this warning appears due to a library, please open an issue in that library, and ask for an update. \
    Please, replace the `#include <rncore.h>` statements  with `#include <FBReactNativeSpec.h>` \
    and update calls of `rncore_ModuleProvider` with `FBReactNativeSpec_ModuleProvider`."

namespace facebook::react {

constexpr auto rncore_ModuleProvider = FBReactNativeSpec_ModuleProvider;

}
