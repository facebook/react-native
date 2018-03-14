// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <fb/fbjni.h>

namespace facebook {
namespace react {

class Instance;

class FabricJSCBinding : public jni::HybridClass<FabricJSCBinding> {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/fabric/jsc/FabricJSCBinding;";

  static void registerNatives();

private:

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

  void installFabric(jlong jsContextNativePointer, jni::alias_ref<jobject> fabricModule);

};

}
}
