/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeViewConfigProviderBinding.h"

namespace facebook::react::NativeViewConfigProviderBinding {

void install(jsi::Runtime &runtime, ProviderType &&provider) {
  auto name = "RN$NativeComponentRegistry_getNativeViewConfig";
  auto hostFunction = [provider = std::move(provider)](
                          jsi::Runtime &runtime,
                          jsi::Value const & /*thisValue*/,
                          jsi::Value const *args,
                          size_t count) -> jsi::Value {
    if (count != 1 || !args[0].isString()) {
      throw new jsi::JSError(runtime, "1 argument of type String expected.");
    }
    return provider(args[0].getString(runtime).utf8(runtime));
  };

  auto jsiFunction = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, name), 2, hostFunction);

  runtime.global().setProperty(runtime, name, jsiFunction);
}
} // namespace facebook::react::NativeViewConfigProviderBinding
