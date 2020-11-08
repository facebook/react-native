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
    /**
     * Optional methods might not be implemented on the Java NativeModule class.
     *  - Unknown: We must check if the method exists using JNI
     *  - Implemented: Using JNI, we verified that the method exists
     *  - Unimplemented: Using JNI, we verified that the method doesn't exist
     */
    enum class ImplStatus {
      Unknown,
      Implemented,
      Unimplemented,
    };

    const TurboModuleMethodValueKind jsReturnType;
    const std::string name;
    const std::string jniSignature;
    const bool isOptional;
    const size_t jsParamCount;
    ImplStatus implStatus;
  };

  class ParseException : public jsi::JSIException {
   public:
    ParseException(std::string what);
  };

 private:
  const std::string moduleName_;
  std::vector<Method> methods_;

  TurboModuleSchema(
      const std::string &moduleName,
      std::vector<Method> &&methods);

 public:
  TurboModuleSchema() = delete;
  bool hasMethod(const std::string &methodName) const;
  Method &getMethod(const std::string &methodName);

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
