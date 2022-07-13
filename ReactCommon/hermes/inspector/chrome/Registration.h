/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <hermes/hermes.h>
#include <hermes/inspector/RuntimeAdapter.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

/*
 * enableDebugging adds this runtime to the list of debuggable JS targets
 * (called "pages" in the higher-leavel React Native API) in this process. It
 * should be called before any JS runs in the runtime.
 */
extern void enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string &title);

/*
 * disableDebugging removes this runtime from the list of debuggable JS targets
 * in this process.
 */
extern void disableDebugging(jsi::Runtime &runtime);

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
