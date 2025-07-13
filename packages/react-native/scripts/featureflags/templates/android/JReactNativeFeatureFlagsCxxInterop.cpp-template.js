/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagDefinitions} from '../../types';

import {
  DO_NOT_MODIFY_COMMENT,
  getCxxJNITypeFromDefaultValue,
  getCxxTypeFromDefaultValue,
} from '../../utils';
import signedsource from 'signedsource';

export default function (definitions: FeatureFlagDefinitions): string {
  return signedsource.signFile(`/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 */

${DO_NOT_MODIFY_COMMENT}

#include "JReactNativeFeatureFlagsCxxInterop.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react {

static jni::alias_ref<jni::JClass> getReactNativeFeatureFlagsProviderJavaClass() {
  static const auto jClass = facebook::jni::findClassStatic(
      "com/facebook/react/internal/featureflags/ReactNativeFeatureFlagsProvider");
  return jClass;
}

/**
 * Implementation of ReactNativeFeatureFlagsProvider that wraps a
 * ReactNativeFeatureFlagsProvider Java object.
 */
class ReactNativeFeatureFlagsJavaProvider
    : public ReactNativeFeatureFlagsProvider {
 public:
  explicit ReactNativeFeatureFlagsJavaProvider(
      jni::alias_ref<jobject> javaProvider)
      : javaProvider_(make_global(javaProvider)){};

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  ${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} ${flagName}() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<${getCxxJNITypeFromDefaultValue(flagConfig.defaultValue)}()>("${flagName}");
    return method(javaProvider_);
  }`,
  )
  .join('\n\n')}

 private:
  jni::global_ref<jobject> javaProvider_;
};

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} JReactNativeFeatureFlagsCxxInterop::${flagName}(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::${flagName}();
}`,
  )
  .join('\n\n')}

void JReactNativeFeatureFlagsCxxInterop::override(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/,
    jni::alias_ref<jobject> provider) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsJavaProvider>(provider));
}

void JReactNativeFeatureFlagsCxxInterop::dangerouslyReset(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  ReactNativeFeatureFlags::dangerouslyReset();
}

jni::local_ref<jstring> JReactNativeFeatureFlagsCxxInterop::dangerouslyForceOverride(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/,
    jni::alias_ref<jobject> provider) {
  auto accessedFlags = ReactNativeFeatureFlags::dangerouslyForceOverride(
             std::make_unique<ReactNativeFeatureFlagsJavaProvider>(provider));
  if (accessedFlags.has_value()) {
    return jni::make_jstring(accessedFlags.value());
  }
  return nullptr;
}

void JReactNativeFeatureFlagsCxxInterop::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "override", JReactNativeFeatureFlagsCxxInterop::override),
      makeNativeMethod("dangerouslyReset", JReactNativeFeatureFlagsCxxInterop::dangerouslyReset),
      makeNativeMethod(
          "dangerouslyForceOverride",
          JReactNativeFeatureFlagsCxxInterop::dangerouslyForceOverride),
${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `      makeNativeMethod(
        "${flagName}",
        JReactNativeFeatureFlagsCxxInterop::${flagName}),`,
  )
  .join('\n')}
  });
}

} // namespace facebook::react
`);
}
