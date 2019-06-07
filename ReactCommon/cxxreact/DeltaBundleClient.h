// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <cstdint>
#include <memory>
#include <string>
#include <unordered_map>
#include <folly/dynamic.h>
#include "JSBigString.h"
#include "RAMBundle.h"

namespace facebook {
namespace react {

class DeltaBundleClient {
public:
  void patch(const folly::dynamic& delta);
  RAMBundle::Module getModule(uint32_t moduleId) const;
  std::unique_ptr<const JSBigString> getStartupCode() const;
  void clear();

private:
  std::unordered_map<uint32_t, std::string> modules_;
  std::string startupCode_;

  void patchModules(const folly::dynamic *delta);
};

} // namespace react
} // namespace facebook
