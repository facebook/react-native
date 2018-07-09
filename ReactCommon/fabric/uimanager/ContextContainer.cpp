// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ContextContainer.h"

namespace facebook {
namespace react {

void ContextContainer::registerInstance(const ClassHandle &handle, SharedInstance instance) {
  std::lock_guard<std::mutex> lock(mutex_);
  instances_.insert({handle, instance});
}

const ContextContainer::SharedInstance &ContextContainer::at(const ClassHandle &handle) const {
  std::lock_guard<std::mutex> lock(mutex_);
  return instances_.at(handle);
}

} // namespace react
} // namespace facebook
