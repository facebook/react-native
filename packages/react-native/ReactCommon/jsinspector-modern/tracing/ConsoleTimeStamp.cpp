/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConsoleTimeStamp.h"

namespace facebook::react::jsinspector_modern::tracing {

std::optional<folly::dynamic> getConsoleTimeStampDetailFromObject(
    jsi::Runtime& runtime,
    const jsi::Value& detailValue) {
  try {
    return jsi::dynamicFromValue(runtime, detailValue);
  } catch (jsi::JSIException&) {
    return std::nullopt;
  }
}

} // namespace facebook::react::jsinspector_modern::tracing
