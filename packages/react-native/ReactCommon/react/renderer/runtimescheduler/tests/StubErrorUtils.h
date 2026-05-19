/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <jsi/jsi.h>

namespace facebook::react {

/*
 * Exposes StubErrorUtils to JavaScript realm.
 */
class StubErrorUtils : public jsi::HostObject {
 public:
  static std::shared_ptr<StubErrorUtils> createAndInstallIfNeeded(jsi::Runtime &runtime)
  {
    auto errorUtilsModuleName = "ErrorUtils";
    auto errorUtilsValue = runtime.global().getProperty(runtime, errorUtilsModuleName);

    if (errorUtilsValue.isUndefined()) {
      auto stubErrorUtils = std::make_shared<StubErrorUtils>();
      auto object = jsi::Object::createFromHostObject(runtime, stubErrorUtils);
      runtime.global().setProperty(runtime, errorUtilsModuleName, std::move(object));
      return stubErrorUtils;
    }

    auto stubErrorUtilsObject = errorUtilsValue.asObject(runtime);
    return stubErrorUtilsObject.getHostObject<StubErrorUtils>(runtime);
  }

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override
  {
    auto propertyName = name.utf8(runtime);

    if (propertyName == "reportFatalError") {
      return jsi::Function::createFromHostFunction(
          runtime,
          name,
          1,
          [this](
              jsi::Runtime &runtime, const jsi::Value &, const jsi::Value *arguments, size_t count) noexcept -> jsi::Value {
            reportFatalCallCount_++;
            if (count > 0 && arguments[0].isObject()) {
              auto obj = arguments[0].getObject(runtime);
              auto msgVal = obj.getProperty(runtime, "message");
              if (msgVal.isString()) {
                lastReportedMessage_ = msgVal.getString(runtime).utf8(runtime);
              }
            }
            return jsi::Value::undefined();
          });
    }

    return jsi::Value::undefined();
  }

  int getReportFatalCallCount() const
  {
    return reportFatalCallCount_;
  }

  const std::string &getLastReportedMessage() const
  {
    return lastReportedMessage_;
  }

 private:
  int reportFatalCallCount_;
  std::string lastReportedMessage_;
};

} // namespace facebook::react
