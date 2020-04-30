/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

class BlobCollector : public jni::HybridClass<BlobCollector>,
                      public jsi::HostObject {
 public:
  BlobCollector(
      jni::global_ref<jobject> blobManager,
      const std::string &blobId);
  ~BlobCollector();

  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/modules/blob/BlobCollector;";

  static void nativeInstall(
      jni::alias_ref<jhybridobject> jThis,
      jni::alias_ref<jobject> blobModule,
      jlong jsContextNativePointer);

  static void registerNatives();

 private:
  friend HybridBase;

  jni::global_ref<jobject> blobModule_;
  const std::string blobId_;
};

} // namespace react
} // namespace facebook
