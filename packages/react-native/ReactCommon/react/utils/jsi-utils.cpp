/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "jsi-utils.h"

namespace facebook::react {

void defineReadOnlyGlobal(
    jsi::Runtime& runtime,
    const std::string& propName,
    jsi::Value&& value) {
  auto global = runtime.global();
  if (global.hasProperty(runtime, propName.c_str())) {
    throw jsi::JSError(
        runtime,
        "Tried to redefine read-only global \"" + propName +
            "\", but read-only globals can only be defined once.");
  }
  jsi::Object jsObject =
      global.getProperty(runtime, "Object").asObject(runtime);
  jsi::Function defineProperty = jsObject.getProperty(runtime, "defineProperty")
                                     .asObject(runtime)
                                     .asFunction(runtime);

  jsi::Object descriptor = jsi::Object(runtime);
  descriptor.setProperty(runtime, "value", std::move(value));
  defineProperty.callWithThis(
      runtime,
      jsObject,
      global,
      jsi::String::createFromUtf8(runtime, propName),
      descriptor);
}

} // namespace facebook::react
