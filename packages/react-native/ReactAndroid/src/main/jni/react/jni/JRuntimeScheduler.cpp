/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JRuntimeScheduler.h"

#include <utility>

namespace facebook::react {

JRuntimeScheduler::JRuntimeScheduler(
    std::weak_ptr<RuntimeScheduler> runtimeScheduler)
    : runtimeScheduler_(std::move(runtimeScheduler)) {}

std::weak_ptr<RuntimeScheduler> JRuntimeScheduler::get() {
  return runtimeScheduler_;
}

} // namespace facebook::react
