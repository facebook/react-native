/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#pragma once

#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <fbjni/fbjni.h>

namespace facebook::react {

/**
 * JNI C++ class for module 'NativeSampleTurboModule'
 */
class JSI_EXPORT NativeSampleTurboModuleSpecJSI : public JavaTurboModule {
 public:
  NativeSampleTurboModuleSpecJSI(const JavaTurboModule::InitParams &params);
};

JSI_EXPORT
std::shared_ptr<TurboModule> SampleTurboModuleSpec_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params);

} // namespace facebook::react
