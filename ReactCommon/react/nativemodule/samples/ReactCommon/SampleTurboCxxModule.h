/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include "NativeSampleTurboCxxModuleSpecJSI.h"

namespace facebook {
namespace react {

/**
 * A sample implementation of the C++ spec. In practice, this class can just
 * extend jsi::HostObject directly, but using the spec provides build-time
 * type-safety.
 */
class SampleTurboCxxModule : public NativeSampleTurboCxxModuleSpecJSI {
 public:
  SampleTurboCxxModule(std::shared_ptr<CallInvoker> jsInvoker);

  void voidFunc(jsi::Runtime &rt) override;
  bool getBool(jsi::Runtime &rt, bool arg) override;
  double getNumber(jsi::Runtime &rt, double arg) override;
  jsi::String getString(jsi::Runtime &rt, const jsi::String &arg) override;
  jsi::Array getArray(jsi::Runtime &rt, const jsi::Array &arg) override;
  jsi::Object getObject(jsi::Runtime &rt, const jsi::Object &arg) override;
  jsi::Object getValue(
      jsi::Runtime &rt,
      double x,
      const jsi::String &y,
      const jsi::Object &z) override;
  void getValueWithCallback(jsi::Runtime &rt, const jsi::Function &callback)
      override;
  jsi::Value getValueWithPromise(jsi::Runtime &rt, bool error) override;
  jsi::Object getConstants(jsi::Runtime &rt) override;
};

} // namespace react
} // namespace facebook
