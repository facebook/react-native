/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkReporter.h"

#include <glog/logging.h>

namespace facebook::react::jsinspector_modern {

NetworkReporter& NetworkReporter::getInstance() {
  static NetworkReporter tracer;
  return tracer;
}

bool NetworkReporter::enableDebugging() {
  std::lock_guard lock(mutex_);
  if (enabled_) {
    return false;
  }

  enabled_ = true;
  LOG(INFO) << "Network debugging enabled" << std::endl;
  return true;
}

bool NetworkReporter::disableDebugging() {
  std::lock_guard lock(mutex_);
  if (!enabled_) {
    return false;
  }

  enabled_ = false;
  LOG(INFO) << "Network debugging disabled" << std::endl;
  return true;
}

} // namespace facebook::react::jsinspector_modern
