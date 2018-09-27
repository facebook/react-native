// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <fb/fbjni.h>
#include <react/jni/ReadableNativeMap.h>

namespace facebook {
namespace react {

class Instance;

class FabricJSIBinding : public jni::HybridClass<FabricJSIBinding> {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/fbreact/fabric/jsi/FabricJSIBinding;";

  static void registerNatives();

private:

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  void releaseEventTarget(jlong jsContextNativePointer, jlong eventTargetPointer);

  void releaseEventHandler(jlong jsContextNativePointer, jlong eventHandlerPointer);

  void dispatchEventToEmptyTarget(
    jlong jsContextNativePointer,
    jlong eventHandlerPointer,
    std::string type,
    NativeMap *payload
  );

  void dispatchEventToTarget(
    jlong jsContextNativePointer,
    jlong eventHandlerPointer,
    jlong eventTargetPointer,
    std::string type,
    NativeMap *payload
  );

  void installFabric(jlong jsContextNativePointer, jni::alias_ref<jobject> fabricModule);

};

}
}
