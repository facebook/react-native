/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "InstanceAgent.h"
#include "SessionState.h"

#include <jsinspector-modern/InstanceTarget.h>

namespace facebook::react::jsinspector_modern {

InstanceTarget::InstanceTarget(InstanceTargetDelegate& delegate)
    : delegate_(delegate) {
  (void)delegate_;
}

InstanceTargetDelegate::~InstanceTargetDelegate() {}

std::unique_ptr<InstanceAgent> InstanceTarget::createAgent(
    FrontendChannel channel,
    SessionState& sessionState) {
  auto runtimeAgent = delegate_.createRuntimeAgent(channel, sessionState);
  return std::make_unique<InstanceAgent>(
      channel, *this, std::move(runtimeAgent));
}

} // namespace facebook::react::jsinspector_modern
