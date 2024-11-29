/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactCxxErrorHandler.h"

using namespace facebook::react;

void JReactCxxErrorHandler::handleError(std::string message) {
  static const auto handleError =
      javaClassStatic()->getStaticMethod<void(std::string message)>(
          "handleError");

  return handleError(javaClassStatic(), message);
}
