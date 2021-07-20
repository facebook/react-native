/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <ReactCommon/TurboModule.h>

namespace facebook {
namespace react {

// TODO: This definition should be codegen'ed for type-safety purpose.
class JSI_EXPORT NativeSampleTurboCxxModuleSpecJSI : public TurboModule {
 protected:
  NativeSampleTurboCxxModuleSpecJSI(std::shared_ptr<CallInvoker> jsInvoker);

 public:
  virtual void voidFunc(jsi::Runtime &rt) = 0;
  virtual bool getBool(jsi::Runtime &rt, bool arg) = 0;
  virtual double getNumber(jsi::Runtime &rt, double arg) = 0;
  virtual jsi::String getString(jsi::Runtime &rt, const jsi::String &arg) = 0;
  virtual jsi::Array getArray(jsi::Runtime &rt, const jsi::Array &arg) = 0;
  virtual jsi::Object getObject(jsi::Runtime &rt, const jsi::Object &arg) = 0;
  virtual jsi::Object getValue(
      jsi::Runtime &rt,
      double x,
      const jsi::String &y,
      const jsi::Object &z) = 0;
  virtual void getValueWithCallback(
      jsi::Runtime &rt,
      const jsi::Function &callback) = 0;
  virtual jsi::Value getValueWithPromise(jsi::Runtime &rt, bool error) = 0;
  virtual jsi::Object getConstants(jsi::Runtime &rt) = 0;
};

} // namespace react
} // namespace facebook
