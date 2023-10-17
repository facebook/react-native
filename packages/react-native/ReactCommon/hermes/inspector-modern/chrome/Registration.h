/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef HERMES_ENABLE_DEBUGGER

#include <memory>
#include <string>

#include <hermes/hermes.h>
#include <hermes/inspector/RuntimeAdapter.h>

namespace facebook {
namespace hermes {
namespace inspector_modern {
namespace chrome {

using DebugSessionToken = int;

/*
 * enableDebugging adds this runtime to the list of debuggable JS targets
 * (called "pages" in the higher-level React Native API) in this process. It
 * should be called before any JS runs in the runtime. The returned token
 * can be used to disable debugging for this runtime.
 */
extern DebugSessionToken enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string& title);

/*
 * disableDebugging removes this runtime from the list of debuggable JS targets
 * in this process. The runtime to remove is identified by the token returned
 * from enableDebugging.
 */
extern void disableDebugging(DebugSessionToken session);

} // namespace chrome
} // namespace inspector_modern
} // namespace hermes
} // namespace facebook

#endif // HERMES_ENABLE_DEBUGGER
