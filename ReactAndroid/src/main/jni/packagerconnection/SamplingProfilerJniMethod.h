// Copyright 2004-present Facebook. All Rights Reserved.

#include <JavaScriptCore/JSProfilerPrivate.h>
#include <JavaScriptCore/JSValueRef.h>
#include <fb/fbjni.h>
#include <jschelpers/JSCHelpers.h>

#include "JSPackagerClientResponder.h"

namespace facebook {
namespace react {

class SamplingProfilerJniMethod
    : public jni::HybridClass<SamplingProfilerJniMethod> {
public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/packagerconnection/"
      "SamplingProfilerPackagerMethod$SamplingProfilerJniMethod;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass> jthis,
                                                jlong javaScriptContext);

  static void registerNatives();

private:
  friend HybridBase;

  explicit SamplingProfilerJniMethod(jlong javaScriptContext);

  void poke(jni::alias_ref<JSPackagerClientResponder::javaobject> responder);

  JSGlobalContextRef context_;
};
}
}
