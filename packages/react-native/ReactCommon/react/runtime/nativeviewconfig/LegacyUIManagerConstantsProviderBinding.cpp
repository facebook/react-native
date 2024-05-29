/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyUIManagerConstantsProviderBinding.h"

namespace facebook::react::LegacyUIManagerConstantsProviderBinding {

void install(
    jsi::Runtime& runtime,
    const std::string& name,
    std::function<jsi::Value(jsi::Runtime&)>&& provider) {
  auto methodName = "RN$LegacyInterop_UIManager_" + name;
  auto hostFunction = [provider = std::move(provider)](
                          jsi::Runtime& runtime,
                          const jsi::Value& /*thisValue*/,
                          const jsi::Value* /*arguments*/,
                          size_t count) -> jsi::Value {
    if (count != 0) {
      throw new jsi::JSError(runtime, "0 arguments expected.");
    }
    return provider(runtime);
  };

  auto jsiFunction = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, name), 2, hostFunction);

  runtime.global().setProperty(runtime, methodName.c_str(), jsiFunction);
}

void install(
    jsi::Runtime& runtime,
    const std::string& name,
    std::function<jsi::Value(jsi::Runtime&, const std::string&)>&& provider) {
  auto methodName = "RN$LegacyInterop_UIManager_" + name;
  auto hostFunction = [provider = std::move(provider)](
                          jsi::Runtime& runtime,
                          const jsi::Value& /*thisValue*/,
                          const jsi::Value* args,
                          size_t count) -> jsi::Value {
    if (count != 1) {
      throw new jsi::JSError(runtime, "1 argument expected.");
    }

    if (!args[0].isString()) {
      throw new jsi::JSError(runtime, "First argument must be string.");
    }

    return provider(runtime, args[0].asString(runtime).utf8(runtime));
  };

  auto jsiFunction = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, name), 2, hostFunction);

  runtime.global().setProperty(runtime, methodName.c_str(), jsiFunction);
}

} // namespace facebook::react::LegacyUIManagerConstantsProviderBinding
