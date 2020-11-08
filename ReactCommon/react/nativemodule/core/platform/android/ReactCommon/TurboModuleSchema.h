/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>
#include <iostream>
#include <string>

namespace facebook {
namespace react {

class TurboModuleSchema {
 public:
  struct Method {
    const TurboModuleMethodValueKind jsReturnType;
    const std::string name;
    const std::string jniSignature;
    const bool isOptional;
  };

  class ParseException : public jsi::JSIException {
   public:
    ParseException(std::string what);
  };

 private:
  const std::string moduleName_;
  const std::vector<Method> methods_;

  TurboModuleSchema(
      const std::string &moduleName,
      std::vector<Method> &&methods);

 public:
  TurboModuleSchema() = delete;
  bool hasMethod(const std::string &methodName) const;
  const Method &getMethod(const std::string &methodName) const;

  static TurboModuleSchema parse(
      jsi::Runtime &runtime,
      const std::string &moduleName,
      const jsi::Value &schema);

  friend std::ostream &operator<<(
      std::ostream &os,
      const TurboModuleSchema &schema);
};

} // namespace react
} // namespace facebook
