/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <string>
#include <stdexcept>

#include <folly/Conv.h>

namespace facebook {
namespace react {

class JSModulesUnbundle {
  /**
   * Represents the set of JavaScript modules that the application consists of.
   * The source code of each module can be retrieved by module ID.
   *
   * The class is non-copyable because copying instances might involve copying
   * several megabytes of memory.
   */
public:
  class ModuleNotFound : public std::out_of_range {
  public:
    using std::out_of_range::out_of_range;
    ModuleNotFound(uint32_t moduleId) : std::out_of_range::out_of_range(
      folly::to<std::string>("Module not found: ", moduleId)) {}
  };
  struct Module {
    std::string name;
    std::string code;
  };
  JSModulesUnbundle() {}
  virtual ~JSModulesUnbundle() {}
  virtual Module getModule(uint32_t moduleId) const = 0;

private:
  JSModulesUnbundle(const JSModulesUnbundle&) = delete;
};

}
}
