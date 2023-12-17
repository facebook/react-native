/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyUIManagerConstantsProviderBinding.h"

namespace facebook::react::LegacyUIManagerConstantsProviderBinding {

void install(jsi::Runtime& runtime, ProviderType&& provider) {
  auto name = "RN$LegacyInterop_UIManager_getConstants";
  auto hostFunction = [provider = std::move(provider)](
                          jsi::Runtime& runtime,
                          const jsi::Value& /*thisValue*/,
                          const jsi::Value* /*arguments*/,
                          size_t count) -> jsi::Value {
    if (count != 0) {
      throw new jsi::JSError(runtime, "0 arguments expected.");
    }
    return provider();
  };

  auto jsiFunction = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, name), 2, hostFunction);

  runtime.global().setProperty(runtime, name, jsiFunction);
}
} // namespace facebook::react::LegacyUIManagerConstantsProviderBinding
