// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <string>
#include <stdexcept>

#include "noncopyable.h"

namespace facebook {
namespace react {

class JSModulesUnbundle : noncopyable {
  /**
   * Represents the set of JavaScript modules that the application consists of.
   * The source code of each module can be retrieved by module ID.
   *
   * The class is non-copyable because copying instances might involve copying
   * several megabytes of memory.
   */
public:
  class ModuleNotFound : public std::out_of_range {
    using std::out_of_range::out_of_range;
  };
  struct Module {
    std::string name;
    std::string code;
  };
  virtual ~JSModulesUnbundle() {}
  virtual Module getModule(uint32_t moduleId) const = 0;
};

}
}
