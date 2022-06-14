/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModule.h"

namespace facebook {
namespace react {

TurboModule::TurboModule(
    std::string name,
    std::shared_ptr<CallInvoker> jsInvoker)
    : name_(std::move(name)), jsInvoker_(std::move(jsInvoker)) {}

jsi::Value TurboModule::get(
    jsi::Runtime &runtime,
    const jsi::PropNameID &propName,
    const MethodMetadata &meta) {
  auto result = jsi::Function::createFromHostFunction(
      runtime,
      propName,
      static_cast<unsigned int>(meta.argCount),
      [this, meta](
          jsi::Runtime &rt,
          const jsi::Value &thisVal,
          const jsi::Value *args,
          size_t count) { return meta.invoker(rt, *this, args, count); });
  // If we have a JS wrapper, cache the result of this lookup
  // We don't cache misses, to allow for methodMap_ to dynamically be extended
  if (jsRepresentation_) {
    jsRepresentation_->setProperty(runtime, propName, result);
  }
  return result;
}

} // namespace react
} // namespace facebook
