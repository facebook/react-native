/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIConstantsProviderBinding.h"

#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/runtime/nativeviewconfig/LegacyUIManagerConstantsProviderBinding.h>

namespace facebook::react {

using namespace facebook::jni;

void UIConstantsProviderBinding::registerNatives() {
  javaClassStatic()->registerNatives({
      makeNativeMethod("install", UIConstantsProviderBinding::install),
  });
}

void UIConstantsProviderBinding::install(
    jni::alias_ref<jclass> /* unused */,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
    jni::alias_ref<DefaultEventTypesProvider::javaobject>
        defaultExportableEventTypesProvider,
    jni::alias_ref<ConstantsForViewManagerProvider::javaobject>
        constantsForViewManagerProvider,
    jni::alias_ref<ConstantsProvider::javaobject> constantsProvider) {
  auto executor = runtimeExecutor->cthis()->get();
  executor([defaultExportableEventTypesProvider =
                make_global(defaultExportableEventTypesProvider),
            constantsForViewManagerProvider =
                make_global(constantsForViewManagerProvider),
            constantsProvider =
                make_global(constantsProvider)](jsi::Runtime& runtime) mutable {
    LegacyUIManagerConstantsProviderBinding::install(
        runtime,
        "getDefaultEventTypes",
        [provider = std::move(defaultExportableEventTypesProvider)](
            jsi::Runtime& runtime) {
          return jsi::valueFromDynamic(
              runtime, provider->getDefaultEventTypes());
        });

    LegacyUIManagerConstantsProviderBinding::install(
        runtime,
        "getConstantsForViewManager",
        [provider = std::move(constantsForViewManagerProvider)](
            jsi::Runtime& runtime, const std::string& viewManagerName) {
          return jsi::valueFromDynamic(
              runtime, provider->getConstantsForViewManager(viewManagerName));
        });

    LegacyUIManagerConstantsProviderBinding::install(
        runtime,
        "getConstants",
        [provider = std::move(constantsProvider)](jsi::Runtime& runtime) {
          return jsi::valueFromDynamic(runtime, provider->getConstants());
        });
  });
}

} // namespace facebook::react
