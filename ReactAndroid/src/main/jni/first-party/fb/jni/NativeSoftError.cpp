/*
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <fb/fbjni.h>
#include <jni/GlobalReference.h>
#include <jni/NativeSoftError.h>
#include <jni/LocalString.h>
#include <jni/Registration.h>

namespace facebook {
namespace jni {
namespace softerror {

using facebook::jni::findClassStatic;
using facebook::jni::LocalString;

static alias_ref<jclass> softErrorClass_;

bool checkSoftErrorClassRef() {
  if (!softErrorClass_) {
    softErrorClass_ = findClassStatic("com/facebook/jni/NativeSoftErrorReporterProxy");
  }

  return softErrorClass_ ? true : false;
}

namespace {
void reportSoftErrorInternal(
    Severity severity,
    const char* category,
    const char* error_msg,
#ifndef JNI_NO_EXCEPTION_PTR
    std::exception_ptr cause,
#endif
    unsigned int samplingFrequency) {
  // Need to ensure we have access to our classes even in an unattached thread.
  ThreadScope::WithClassLoader([&] {
    if (!checkSoftErrorClassRef()) {
      return;
    }

    static auto softReport =
      softErrorClass_->getStaticMethod<void(jint, jstring, jstring, jthrowable, jint)>("softReport");
    LocalString jstrCategory(category);
    LocalString jstrErrorMsg(error_msg);
    softReport(softErrorClass_,
      severity,
      jstrCategory.string(),
      jstrErrorMsg.string(),
#ifndef JNI_NO_EXCEPTION_PTR
      (cause == nullptr) ? getJavaExceptionForCppBackTrace().get() : getJavaExceptionForCppException(cause).get(),   
#else
      getJavaExceptionForCppBackTrace().get(),
#endif
      samplingFrequency);
    });
}
}

void reportSoftError(
    Severity severity,
    const char* category,
    const char* error_msg,
    unsigned int samplingFrequency) {
  reportSoftErrorInternal(
    severity,
    category,
    error_msg,
#ifndef JNI_NO_EXCEPTION_PTR
    nullptr,
#endif
    samplingFrequency);
}

#ifndef JNI_NO_EXCEPTION_PTR
void FBEXPORT reportSoftError(
    Severity severity,
    const char* category,
    const char* error_msg,
    std::exception_ptr cause,
    unsigned int samplingFrequency) {

  reportSoftErrorInternal(
    severity,
    category,
    error_msg,
    cause,
    samplingFrequency);
}
#endif
  
void generateNativeSoftError() {
  reportSoftError(Severity::MUST_FIX, "SoftErrorTest_1", "Reporting MUST_FIX");
#ifndef JNI_NO_EXCEPTION_PTR
  reportSoftError(
    Severity::WARNING,
    "SoftErrorTest_2",
    "Reporting WARNING with cause",
    make_exception_ptr(std::invalid_argument("Fake exception")));
#endif
}

void SoftErrorOnLoad(JNIEnv* env) {
  if(!checkSoftErrorClassRef()) {
    return;
  }

  registerNatives(env, softErrorClass_.get(), {
    { "generateNativeSoftError", "()V", (void*) generateNativeSoftError }
  });
}

} } }
