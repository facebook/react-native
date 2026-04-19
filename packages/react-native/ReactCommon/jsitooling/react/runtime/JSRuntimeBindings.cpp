/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSRuntimeBindings.h"

#include <react/timing/primitives.h>

namespace facebook::react {

void bindNativeLogger(jsi::Runtime& runtime, Logger logger) {
  runtime.global().setProperty(
      runtime,
      "nativeLoggingHook",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "nativeLoggingHook"),
          2,
          [logger = std::move(logger)](
              jsi::Runtime& runtime,
              const jsi::Value& /* this */,
              const jsi::Value* args,
              size_t count) {
            if (count != 2) {
              throw std::invalid_argument(
                  "nativeLoggingHook takes 2 arguments");
            }
            logger(
                args[0].asString(runtime).utf8(runtime),
                static_cast<unsigned int>(args[1].asNumber()));
            return jsi::Value::undefined();
          }));
}

void bindNativePerformanceNow(jsi::Runtime& runtime) {
  runtime.global().setProperty(
      runtime,
      "nativePerformanceNow",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "nativePerformanceNow"),
          0,
          [](jsi::Runtime& /* runtime */,
             const jsi::Value& /* this */,
             const jsi::Value* /* args */,
             size_t /*count*/) {
            return HighResTimeStamp::now().toDOMHighResTimeStamp();
          }));
}

} // namespace facebook::react
