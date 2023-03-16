/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JRuntimeScheduler.h"

namespace facebook {
namespace react {

JRuntimeScheduler::JRuntimeScheduler(
    std::weak_ptr<RuntimeScheduler> runtimeScheduler)
    : runtimeScheduler_(runtimeScheduler) {}

std::weak_ptr<RuntimeScheduler> JRuntimeScheduler::get() {
  return runtimeScheduler_;
}

} // namespace react
} // namespace facebook
