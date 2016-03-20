/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "jni/fbjni.h"

#include <fb/assert.h>

#include <alloca.h>
#include <cstdlib>
#include <ios>
#include <stdexcept>
#include <stdio.h>
#include <string>
#include <system_error>

#include <jni.h>

namespace facebook {
namespace jni {

// CommonJniExceptions /////////////////////////////////////////////////////////////////////////////

class CommonJniExceptions {
 public:
  static void init();

  static jclass getThrowableClass() {
    return throwableClass_;
  }

  static jclass getUnknownCppExceptionClass() {
    return unknownCppExceptionClass_;
  }

  static jthrowable getUnknownCppExceptionObject() {
    return unknownCppExceptionObject_;
  }

  static jthrowable getRuntimeExceptionObject() {
    return runtimeExceptionObject_;
  }

 private:
  static jclass throwableClass_;
  static jclass unknownCppExceptionClass_;
  static jthrowable unknownCppExceptionObject_;
  static jthrowable runtimeExceptionObject_;
};

// The variables in this class are all JNI global references and are intentionally leaked because
// we assume this library cannot be unloaded. These global references are created manually instead
// of using global_ref from References.h to avoid circular dependency.
jclass CommonJniExceptions::throwableClass_ = nullptr;
jclass CommonJniExceptions::unknownCppExceptionClass_ = nullptr;
jthrowable CommonJniExceptions::unknownCppExceptionObject_ = nullptr;
jthrowable CommonJniExceptions::runtimeExceptionObject_ = nullptr;


// Variable to guarantee that fallback exceptions have been initialized early. We don't want to
// do pure dynamic initialization -- we want to warn programmers early that they need to run the
// helpers at library load time instead of lazily getting them when the exception helpers are
// first used.
static std::atomic<bool> gIsInitialized(false);

void CommonJniExceptions::init() {
  JNIEnv* env = internal::getEnv();
  FBASSERTMSGF(env, "Could not get JNI Environment");

  // Throwable class
  jclass localThrowableClass = env->FindClass("java/lang/Throwable");
  FBASSERT(localThrowableClass);
  throwableClass_ = static_cast<jclass>(env->NewGlobalRef(localThrowableClass));
  FBASSERT(throwableClass_);
  env->DeleteLocalRef(localThrowableClass);

  // UnknownCppException class
  jclass localUnknownCppExceptionClass = env->FindClass("com/facebook/jni/UnknownCppException");
  FBASSERT(localUnknownCppExceptionClass);
  jmethodID unknownCppExceptionConstructorMID = env->GetMethodID(
      localUnknownCppExceptionClass,
      "<init>",
      "()V");
  FBASSERT(unknownCppExceptionConstructorMID);
  unknownCppExceptionClass_ = static_cast<jclass>(env->NewGlobalRef(localUnknownCppExceptionClass));
  FBASSERT(unknownCppExceptionClass_);
  env->DeleteLocalRef(localUnknownCppExceptionClass);

  // UnknownCppException object
  jthrowable localUnknownCppExceptionObject = static_cast<jthrowable>(env->NewObject(
      unknownCppExceptionClass_,
      unknownCppExceptionConstructorMID));
  FBASSERT(localUnknownCppExceptionObject);
  unknownCppExceptionObject_ = static_cast<jthrowable>(env->NewGlobalRef(
      localUnknownCppExceptionObject));
  FBASSERT(unknownCppExceptionObject_);
  env->DeleteLocalRef(localUnknownCppExceptionObject);

  // RuntimeException object
  jclass localRuntimeExceptionClass = env->FindClass("java/lang/RuntimeException");
  FBASSERT(localRuntimeExceptionClass);

  jmethodID runtimeExceptionConstructorMID = env->GetMethodID(
      localRuntimeExceptionClass,
      "<init>",
      "()V");
  FBASSERT(runtimeExceptionConstructorMID);
  jthrowable localRuntimeExceptionObject = static_cast<jthrowable>(env->NewObject(
      localRuntimeExceptionClass,
      runtimeExceptionConstructorMID));
  FBASSERT(localRuntimeExceptionObject);
  runtimeExceptionObject_ = static_cast<jthrowable>(env->NewGlobalRef(localRuntimeExceptionObject));
  FBASSERT(runtimeExceptionObject_);

  env->DeleteLocalRef(localRuntimeExceptionClass);
  env->DeleteLocalRef(localRuntimeExceptionObject);
}


// initExceptionHelpers() //////////////////////////////////////////////////////////////////////////

void internal::initExceptionHelpers() {
  CommonJniExceptions::init();
  gIsInitialized.store(true, std::memory_order_seq_cst);
}

void assertIfExceptionsNotInitialized() {
  // Use relaxed memory order because we don't need memory barriers.
  // The real init-once enforcement is done by the compiler for the
  // "static" in initExceptionHelpers.
  FBASSERTMSGF(gIsInitialized.load(std::memory_order_relaxed),
               "initExceptionHelpers was never called!");
}

// Exception throwing & translating functions //////////////////////////////////////////////////////

// Functions that throw Java exceptions

namespace {

void setJavaExceptionAndAbortOnFailure(jthrowable throwable) noexcept {
  assertIfExceptionsNotInitialized();
  JNIEnv* env = internal::getEnv();
  if (throwable) {
    env->Throw(throwable);
  }
  if (env->ExceptionCheck() != JNI_TRUE) {
    std::abort();
  }
}

void setDefaultException() noexcept {
  assertIfExceptionsNotInitialized();
  setJavaExceptionAndAbortOnFailure(CommonJniExceptions::getRuntimeExceptionObject());
}

void setCppSystemErrorExceptionInJava(const std::system_error& ex) noexcept {
  assertIfExceptionsNotInitialized();
  JNIEnv* env = internal::getEnv();
  jclass cppSystemErrorExceptionClass = env->FindClass(
      "com/facebook/jni/CppSystemErrorException");
  if (!cppSystemErrorExceptionClass) {
    setDefaultException();
    return;
  }
  jmethodID constructorMID = env->GetMethodID(
      cppSystemErrorExceptionClass,
      "<init>",
      "(Ljava/lang/String;I)V");
  if (!constructorMID) {
    setDefaultException();
    return;
  }
  jthrowable cppSystemErrorExceptionObject = static_cast<jthrowable>(env->NewObject(
      cppSystemErrorExceptionClass,
      constructorMID,
      env->NewStringUTF(ex.what()),
      ex.code().value()));
  setJavaExceptionAndAbortOnFailure(cppSystemErrorExceptionObject);
}

template<typename... ARGS>
void setNewJavaException(jclass exceptionClass, const char* fmt, ARGS... args) {
  assertIfExceptionsNotInitialized();
  int msgSize = snprintf(nullptr, 0, fmt, args...);
  JNIEnv* env = internal::getEnv();

  try {
    char *msg = (char*) alloca(msgSize + 1);
    snprintf(msg, kMaxExceptionMessageBufferSize, fmt, args...);
    env->ThrowNew(exceptionClass, msg);
  } catch (...) {
    env->ThrowNew(exceptionClass, "");
  }

  if (env->ExceptionCheck() != JNI_TRUE) {
    setDefaultException();
  }
}

void setNewJavaException(jclass exceptionClass, const char* msg) {
  assertIfExceptionsNotInitialized();
  setNewJavaException(exceptionClass, "%s", msg);
}

template<typename... ARGS>
void setNewJavaException(const char* className, const char* fmt, ARGS... args) {
  assertIfExceptionsNotInitialized();
  JNIEnv* env = internal::getEnv();
  jclass exceptionClass = env->FindClass(className);
  if (env->ExceptionCheck() != JNI_TRUE && !exceptionClass) {
    // If FindClass() has failed but no exception has been thrown, throw a default exception.
    setDefaultException();
    return;
  }
  setNewJavaException(exceptionClass, fmt, args...);
}

}

// Functions that throw C++ exceptions

// TODO(T6618159) Take a stack dump here to save context if it results in a crash when propagated
void throwPendingJniExceptionAsCppException() {
  assertIfExceptionsNotInitialized();
  JNIEnv* env = internal::getEnv();
  if (env->ExceptionCheck() == JNI_FALSE) {
    return;
  }

  jthrowable throwable = env->ExceptionOccurred();
  if (!throwable) {
    throw std::runtime_error("Unable to get pending JNI exception.");
  }

  env->ExceptionClear();
  throw JniException(throwable);
}

void throwCppExceptionIf(bool condition) {
  assertIfExceptionsNotInitialized();
  if (!condition) {
    return;
  }

  JNIEnv* env = internal::getEnv();
  if (env->ExceptionCheck() == JNI_TRUE) {
    throwPendingJniExceptionAsCppException();
    return;
  }

  throw JniException();
}

void throwNewJavaException(jthrowable throwable) {
  throw JniException(throwable);
}

void throwNewJavaException(const char* throwableName, const char* msg) {
  // If anything of the fbjni calls fail, an exception of a suitable
  // form will be thrown, which is what we want.
  auto throwableClass = findClassLocal(throwableName);
  auto throwable = throwableClass->newObject(
    throwableClass->getConstructor<jthrowable(jstring)>(),
    make_jstring(msg).release());
  throwNewJavaException(throwable.get());
}

// Translate C++ to Java Exception

void translatePendingCppExceptionToJavaException() noexcept {
  assertIfExceptionsNotInitialized();
  try {
    try {
      throw;
    } catch(const JniException& ex) {
      ex.setJavaException();
    } catch(const std::ios_base::failure& ex) {
      setNewJavaException("java/io/IOException", ex.what());
    } catch(const std::bad_alloc& ex) {
      setNewJavaException("java/lang/OutOfMemoryError", ex.what());
    } catch(const std::out_of_range& ex) {
      setNewJavaException("java/lang/ArrayIndexOutOfBoundsException", ex.what());
    } catch(const std::system_error& ex) {
      setCppSystemErrorExceptionInJava(ex);
    } catch(const std::runtime_error& ex) {
      setNewJavaException("java/lang/RuntimeException", ex.what());
    } catch(const std::exception& ex) {
      setNewJavaException("com/facebook/jni/CppException", ex.what());
    } catch(const char* msg) {
      setNewJavaException(CommonJniExceptions::getUnknownCppExceptionClass(), msg);
    } catch(...) {
      setJavaExceptionAndAbortOnFailure(CommonJniExceptions::getUnknownCppExceptionObject());
    }
  } catch(...) {
    // This block aborts the program, if something bad happens when handling exceptions, thus
    // keeping this function noexcept.
    std::abort();
  }
}

// JniException ////////////////////////////////////////////////////////////////////////////////////

const std::string JniException::kExceptionMessageFailure_ = "Unable to get exception message.";

JniException::JniException() : JniException(CommonJniExceptions::getRuntimeExceptionObject()) { }

JniException::JniException(jthrowable throwable) : isMessageExtracted_(false) {
  assertIfExceptionsNotInitialized();
  throwableGlobalRef_ = static_cast<jthrowable>(internal::getEnv()->NewGlobalRef(throwable));
  if (!throwableGlobalRef_) {
    throw std::bad_alloc();
  }
}

JniException::JniException(JniException &&rhs)
    : throwableGlobalRef_(std::move(rhs.throwableGlobalRef_)),
      what_(std::move(rhs.what_)),
      isMessageExtracted_(rhs.isMessageExtracted_) {
  rhs.throwableGlobalRef_ = nullptr;
}

JniException::JniException(const JniException &rhs)
    : what_(rhs.what_), isMessageExtracted_(rhs.isMessageExtracted_) {
  JNIEnv* env = internal::getEnv();
  if (rhs.getThrowable()) {
    throwableGlobalRef_ = static_cast<jthrowable>(env->NewGlobalRef(rhs.getThrowable()));
    if (!throwableGlobalRef_) {
      throw std::bad_alloc();
    }
  } else {
    throwableGlobalRef_ = nullptr;
  }
}

JniException::~JniException() noexcept {
  if (throwableGlobalRef_) {
    internal::getEnv()->DeleteGlobalRef(throwableGlobalRef_);
  }
}

jthrowable JniException::getThrowable() const noexcept {
  return throwableGlobalRef_;
}

// TODO 6900503: consider making this thread-safe.
void JniException::populateWhat() const noexcept {
  JNIEnv* env = internal::getEnv();

  jmethodID toStringMID = env->GetMethodID(
      CommonJniExceptions::getThrowableClass(),
      "toString",
      "()Ljava/lang/String;");
  jstring messageJString = (jstring) env->CallObjectMethod(
      throwableGlobalRef_,
      toStringMID);

  isMessageExtracted_ = true;

  if (env->ExceptionCheck()) {
    env->ExceptionClear();
    what_ = kExceptionMessageFailure_;
    return;
  }

  const char* chars = env->GetStringUTFChars(messageJString, nullptr);
  if (!chars) {
    what_ = kExceptionMessageFailure_;
    return;
  }

  try {
    what_ = std::string(chars);
  } catch(...) {
    what_ = kExceptionMessageFailure_;
  }

  env->ReleaseStringUTFChars(messageJString, chars);
}

const char* JniException::what() const noexcept {
  if (!isMessageExtracted_) {
    populateWhat();
  }
  return what_.c_str();
}

void JniException::setJavaException() const noexcept {
  setJavaExceptionAndAbortOnFailure(throwableGlobalRef_);
}

}}
