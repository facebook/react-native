// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <cxxreact/JSDeltaBundleClient.h>
#include <fb/fbjni.h>
#include <fb/fbjni/Hybrid.h>
#include <fb/fbjni/ReadableByteChannel.h>

namespace facebook {
namespace react {

class NativeDeltaClient : public jni::HybridClass<NativeDeltaClient> {

public:
  static constexpr auto kJavaDescriptor =
    "Lcom/facebook/react/bridge/NativeDeltaClient;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);
  static void registerNatives();

  ~NativeDeltaClient() override = default;

  std::shared_ptr<const JSDeltaBundleClient> getDeltaClient() {
    return deltaClient_;
  }

private:
  friend HybridBase;
  void jniProcessDelta(jni::alias_ref<jni::JReadableByteChannel> delta);
  void jniReset();
  const std::shared_ptr<JSDeltaBundleClient> deltaClient_ =
    std::make_shared<JSDeltaBundleClient>();
};

} // namespace react
} // namespace facebook
