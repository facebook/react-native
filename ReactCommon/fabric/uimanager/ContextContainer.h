// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>
#include <typeindex>
#include <typeinfo>
#include <unordered_map>

namespace facebook {
namespace react {

class ContextContainer;

using SharedContextContainer = std::shared_ptr<ContextContainer>;

/*
 * General purpose dependecy injection container.
 */
class ContextContainer final {

public:
  using ClassHandle = std::type_index;
  using SharedInstance = std::shared_ptr<void>;

  void registerInstance(const ClassHandle &handle, SharedInstance instance);

  const SharedInstance &at(const ClassHandle &handle) const;

private:
  std::unordered_map<ClassHandle, SharedInstance> instances_;
  mutable std::mutex mutex_;
};

} // namespace react
} // namespace facebook
