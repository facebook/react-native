// Copyright 2004-present Facebook. All Rights Reserved.

#include "SamplingProfilerJniMethod.h"

#include <JavaScriptCore/JSProfilerPrivate.h>

#include <jschelpers/JSCHelpers.h>
#include <jni.h>
#include <string>

using namespace facebook::jni;

namespace facebook {
namespace react {

/* static */ jni::local_ref<SamplingProfilerJniMethod::jhybriddata>
SamplingProfilerJniMethod::initHybrid(jni::alias_ref<jclass>,
                                      jlong javaScriptContext) {
  return makeCxxInstance(javaScriptContext);
}

/* static */ void SamplingProfilerJniMethod::registerNatives() {
  registerHybrid(
      {makeNativeMethod("initHybrid", SamplingProfilerJniMethod::initHybrid),
       makeNativeMethod("poke", SamplingProfilerJniMethod::poke)});
}

SamplingProfilerJniMethod::SamplingProfilerJniMethod(jlong javaScriptContext) {
  context_ = reinterpret_cast<JSGlobalContextRef>(javaScriptContext);
}

void SamplingProfilerJniMethod::poke(
    jni::alias_ref<JSPackagerClientResponder::javaobject> responder) {
  if (!JSC_JSSamplingProfilerEnabled(context_)) {
    responder->error("The JSSamplingProfiler is disabled. See this "
                     "https://fburl.com/u4lw7xeq for some help");
    return;
  }

  JSValueRef jsResult = JSC_JSPokeSamplingProfiler(context_);
  if (JSC_JSValueGetType(context_, jsResult) == kJSTypeNull) {
    responder->respond("started");
  } else {
    JSStringRef resultStrRef = JSValueToStringCopy(context_, jsResult, nullptr);
    size_t length = JSStringGetLength(resultStrRef);
    char buffer[length + 1];
    JSStringGetUTF8CString(resultStrRef, buffer, length + 1);
    JSStringRelease(resultStrRef);
    responder->respond(buffer);
  }
}
}
}
