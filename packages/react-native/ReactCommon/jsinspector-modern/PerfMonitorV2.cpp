/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PerfMonitorV2.h"
#include "HostTarget.h"

#include <folly/json.h>
#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern {

void PerfMonitorUpdateHandler::handlePerfIssueAdded(
    const std::string& message) {
  auto payload = folly::parseJson(message);

  if (payload.isObject()) {
    delegate_.unstable_onPerfIssueAdded(
        PerfIssuePayload{
            .name = payload["name"].asString(),
            .severity = payload["severity"].asString(),
        });
  }
}

} // namespace facebook::react::jsinspector_modern
