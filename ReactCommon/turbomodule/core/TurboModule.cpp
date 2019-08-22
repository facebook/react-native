/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModule.h"

using namespace facebook;

namespace facebook {
namespace react {

TurboModule::TurboModule(
    const std::string &name,
    std::shared_ptr<JSCallInvoker> jsInvoker)
    : name_(name), jsInvoker_(jsInvoker) {}

TurboModule::~TurboModule() {}

jsi::Value TurboModule::get(
    jsi::Runtime &runtime,
    const jsi::PropNameID &propName) {
  std::string propNameUtf8 = propName.utf8(runtime);
  auto p = methodMap_.find(propNameUtf8);
  if (p == methodMap_.end()) {
    // Method was not found, let JS decide what to do.
    return jsi::Value::undefined();
  }
  MethodMetadata meta = p->second;
  return jsi::Function::createFromHostFunction(
      runtime,
      propName,
      meta.argCount,
      [this, meta](
          facebook::jsi::Runtime &rt,
          const facebook::jsi::Value &thisVal,
          const facebook::jsi::Value *args,
          size_t count) { return meta.invoker(rt, *this, args, count); });
}

} // namespace react
} // namespace facebook
