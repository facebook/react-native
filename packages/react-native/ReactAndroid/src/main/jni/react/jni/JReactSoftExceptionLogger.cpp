/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactSoftExceptionLogger.h"

#include <utility>

using namespace facebook::react;

void JReactSoftExceptionLogger::logNoThrowSoftExceptionWithMessage(
    std::string tag,
    std::string message) {
  static const auto logNoThrowSoftExceptionWithMessage =
      javaClassStatic()
          ->getStaticMethod<void(std::string tag, std::string message)>(
              "logNoThrowSoftExceptionWithMessage");

  return logNoThrowSoftExceptionWithMessage(
      javaClassStatic(), std::move(tag), std::move(message));
}
