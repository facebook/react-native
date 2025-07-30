/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BlobCollector.h"

#include <fbjni/fbjni.h>
#include <memory>
#include <utility>

using namespace facebook;

namespace facebook::react {

static constexpr auto kBlobModuleJavaDescriptor =
    "com/facebook/react/modules/blob/BlobModule";

BlobCollector::BlobCollector(
    jni::global_ref<jobject> blobModule,
    std::string blobId)
    : blobModule_(std::move(blobModule)), blobId_(std::move(blobId)) {}

BlobCollector::~BlobCollector() {
  jni::ThreadScope::WithClassLoader([&] {
    static auto removeMethod = jni::findClassStatic(kBlobModuleJavaDescriptor)
                                   ->getMethod<void(jstring)>("remove");
    removeMethod(blobModule_, jni::make_jstring(blobId_).get());
    blobModule_.reset();
  });
}

size_t BlobCollector::getBlobLength() {
  static auto getLengthMethod =
      jni::findClassStatic(kBlobModuleJavaDescriptor)
          ->getMethod<jlong(jstring)>("getLengthOfBlob");
  auto length = getLengthMethod(blobModule_, jni::make_jstring(blobId_).get());
  return static_cast<size_t>(length);
}

void BlobCollector::nativeInstall(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<jobject> blobModule,
    jlong jsContextNativePointer) {
  auto& runtime = *((jsi::Runtime*)jsContextNativePointer);
  auto blobModuleRef = jni::make_global(blobModule);
  runtime.global().setProperty(
      runtime,
      "__blobCollectorProvider",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "__blobCollectorProvider"),
          1,
          [blobModuleRef](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t /*count*/) {
            auto blobId = args[0].asString(rt).utf8(rt);
            auto blobCollector =
                std::make_shared<BlobCollector>(blobModuleRef, blobId);
            auto blobCollectorJsObject =
                jsi::Object::createFromHostObject(rt, blobCollector);
            blobCollectorJsObject.setExternalMemoryPressure(
                rt, blobCollector->getBlobLength());
            return blobCollectorJsObject;
          }));
}

void BlobCollector::registerNatives() {
  registerHybrid(
      {makeNativeMethod("nativeInstall", BlobCollector::nativeInstall)});
}

} // namespace facebook::react
