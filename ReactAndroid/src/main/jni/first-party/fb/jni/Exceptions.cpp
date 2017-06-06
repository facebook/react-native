/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <fb/fbjni/CoreClasses.h>

#include <fb/assert.h>
#include <fb/log.h>

#ifdef USE_LYRA
#include <fb/lyra.h>
#include <fb/lyra_exceptions.h>
#endif

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

namespace {
class JRuntimeException : public JavaClass<JRuntimeException, JThrowable> {
 public:
  static auto constexpr kJavaDescriptor = "Ljava/lang/RuntimeException;";

  static local_ref<JRuntimeException> create(const char* str) {
    return newInstance(make_jstring(str));
  }

  static local_ref<JRuntimeException> create() {
    return newInstance();
  }
};

class JIOException : public JavaClass<JIOException, JThrowable> {
 public:
  static auto constexpr kJavaDescriptor = "Ljava/io/IOException;";

  static local_ref<JIOException> create(const char* str) {
    return newInstance(make_jstring(str));
  }
};

class JOutOfMemoryError : public JavaClass<JOutOfMemoryError, JThrowable> {
 public:
  static auto constexpr kJavaDescriptor = "Ljava/lang/OutOfMemoryError;";

  static local_ref<JOutOfMemoryError> create(const char* str) {
    return newInstance(make_jstring(str));
  }
};

class JArrayIndexOutOfBoundsException : public JavaClass<JArrayIndexOutOfBoundsException, JThrowable> {
 public:
  static auto constexpr kJavaDescriptor = "Ljava/lang/ArrayIndexOutOfBoundsException;";

  static local_ref<JArrayIndexOutOfBoundsException> create(const char* str) {
    return newInstance(make_jstring(str));
  }
};

class JUnknownCppException : public JavaClass<JUnknownCppException, JThrowable> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/jni/UnknownCppException;";

  static local_ref<JUnknownCppException> create() {
    return newInstance();
  }

  static local_ref<JUnknownCppException> create(const char* str) {
    return newInstance(make_jstring(str));
  }
};

class JCppSystemErrorException : public JavaClass<JCppSystemErrorException, JThrowable> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/jni/CppSystemErrorException;";

  static local_ref<JCppSystemErrorException> create(const std::system_error& e) {
    return newInstance(make_jstring(e.what()), e.code().value());
  }
};

// Exception throwing & translating functions //////////////////////////////////////////////////////

// Functions that throw Java exceptions

void setJavaExceptionAndAbortOnFailure(alias_ref<JThrowable> throwable) {
  auto env = Environment::current();
  if (throwable) {
    env->Throw(throwable.get());
  }
  if (env->ExceptionCheck() != JNI_TRUE) {
    std::abort();
  }
}

}

// Functions that throw C++ exceptions

// TODO(T6618159) Inject the c++ stack into the exception's stack trace. One
// issue: when a java exception is created, it captures the full java stack
// across jni boundaries. lyra will only capture the c++ stack to the jni
// boundary. So, as we pass the java exception up to c++, we need to capture
// the c++ stack and then insert it into the correct place in the java stack
// trace. Then, as the exception propagates across the boundaries, we will
// slowly fill in the c++ parts of the trace.
void throwPendingJniExceptionAsCppException() {
  JNIEnv* env = Environment::current();
  if (env->ExceptionCheck() == JNI_FALSE) {
    return;
  }

  auto throwable = adopt_local(env->ExceptionOccurred());
  if (!throwable) {
    throw std::runtime_error("Unable to get pending JNI exception.");
  }
  env->ExceptionClear();

  throw JniException(throwable);
}

void throwCppExceptionIf(bool condition) {
  if (!condition) {
    return;
  }

  auto env = Environment::current();
  if (env->ExceptionCheck() == JNI_TRUE) {
    throwPendingJniExceptionAsCppException();
    return;
  }

  throw JniException();
}

void throwNewJavaException(jthrowable throwable) {
  throw JniException(wrap_alias(throwable));
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

// jthrowable //////////////////////////////////////////////////////////////////////////////////////

local_ref<JThrowable> JThrowable::initCause(alias_ref<JThrowable> cause) {
  static auto meth = javaClassStatic()->getMethod<javaobject(alias_ref<javaobject>)>("initCause");
  return meth(self(), cause);
}

auto JThrowable::getStackTrace() -> local_ref<JStackTrace> {
  static auto meth = javaClassStatic()->getMethod<JStackTrace::javaobject()>("getStackTrace");
  return meth(self());
}

void JThrowable::setStackTrace(alias_ref<JStackTrace> stack) {
  static auto meth = javaClassStatic()->getMethod<void(alias_ref<JStackTrace>)>("setStackTrace");
  return meth(self(), stack);
}

auto JStackTraceElement::create(
    const std::string& declaringClass, const std::string& methodName, const std::string& file, int line)
    -> local_ref<javaobject> {
  return newInstance(declaringClass, methodName, file, line);
}

std::string JStackTraceElement::getClassName() const {
  static auto meth = javaClassStatic()->getMethod<local_ref<JString>()>("getClassName");
  return meth(self())->toStdString();
}

std::string JStackTraceElement::getMethodName() const {
  static auto meth = javaClassStatic()->getMethod<local_ref<JString>()>("getMethodName");
  return meth(self())->toStdString();
}

std::string JStackTraceElement::getFileName() const {
  static auto meth = javaClassStatic()->getMethod<local_ref<JString>()>("getFileName");
  return meth(self())->toStdString();
}

int JStackTraceElement::getLineNumber() const {
  static auto meth = javaClassStatic()->getMethod<jint()>("getLineNumber");
  return meth(self());
}

// Translate C++ to Java Exception

namespace {

// For each exception in the chain of the exception_ptr argument, func
// will be called with that exception (in reverse order, i.e. innermost first).
#ifndef FBJNI_NO_EXCEPTION_PTR
void denest(const std::function<void(std::exception_ptr)>& func, std::exception_ptr ptr) {
  FBASSERT(ptr);
  try {
    std::rethrow_exception(ptr);
  } catch (const std::nested_exception& e) {
    denest(func, e.nested_ptr());
  } catch (...) {
    // ignored.
  }
  func(ptr);
  }
#endif

} // namespace


#ifdef USE_LYRA
local_ref<JStackTraceElement> createJStackTraceElement(const lyra::StackTraceElement& cpp) {
  return JStackTraceElement::create(
      "|lyra|{" + cpp.libraryName() + "}", cpp.functionName(), cpp.buildId(), cpp.libraryOffset());
}
#endif

#ifndef FBJNI_NO_EXCEPTION_PTR
void addCppStacktraceToJavaException(alias_ref<JThrowable> java, std::exception_ptr cpp) {
#ifdef USE_LYRA
  auto cppStack = lyra::getStackTraceSymbols(
                    (cpp == nullptr) ?
                      lyra::getStackTrace()
                      : lyra::getExceptionTrace(cpp));

  auto javaStack = java->getStackTrace();
  auto newStack = JThrowable::JStackTrace::newArray(javaStack->size() + cppStack.size());
  size_t i = 0;
  for (size_t j = 0; j < cppStack.size(); j++, i++) {
    (*newStack)[i] = createJStackTraceElement(cppStack[j]);
  }
  for (size_t j = 0; j < javaStack->size(); j++, i++) {
    (*newStack)[i] = (*javaStack)[j];
  }
  java->setStackTrace(newStack);
#endif
}

local_ref<JThrowable> convertCppExceptionToJavaException(std::exception_ptr ptr) {
  FBASSERT(ptr);
  local_ref<JThrowable> current;
  bool addCppStack = true;
  try {
    std::rethrow_exception(ptr);
    addCppStack = false;
  } catch (const JniException& ex) {
    current = ex.getThrowable();
  } catch (const std::ios_base::failure& ex) {
    current = JIOException::create(ex.what());
  } catch (const std::bad_alloc& ex) {
    current = JOutOfMemoryError::create(ex.what());
  } catch (const std::out_of_range& ex) {
    current = JArrayIndexOutOfBoundsException::create(ex.what());
  } catch (const std::system_error& ex) {
    current = JCppSystemErrorException::create(ex);
  } catch (const std::runtime_error& ex) {
    current = JRuntimeException::create(ex.what());
  } catch (const std::exception& ex) {
    current = JCppException::create(ex.what());
  } catch (const char* msg) {
    current = JUnknownCppException::create(msg);
  } catch (...) {
    current = JUnknownCppException::create();
  }

  if (addCppStack) {
    addCppStacktraceToJavaException(current, ptr);
  }
  return current;
  }
#endif

local_ref<JThrowable> getJavaExceptionForCppBackTrace() {
  return getJavaExceptionForCppBackTrace(nullptr);
}

local_ref<JThrowable> getJavaExceptionForCppBackTrace(const char* msg) {
  local_ref<JThrowable> current =
      msg ? JUnknownCppException::create(msg) : JUnknownCppException::create();
#ifndef FBJNI_NO_EXCEPTION_PTR
  addCppStacktraceToJavaException(current, nullptr);
#endif
  return current;
}


#ifndef FBJNI_NO_EXCEPTION_PTR
local_ref<JThrowable> getJavaExceptionForCppException(std::exception_ptr ptr) {
  FBASSERT(ptr);
  local_ref<JThrowable> previous;
  auto func = [&previous] (std::exception_ptr ptr) {
    auto current = convertCppExceptionToJavaException(ptr);
    if (previous) {
      current->initCause(previous);
    }
    previous = current;
  };
  denest(func, ptr);
  return previous;
}
#endif

void translatePendingCppExceptionToJavaException() {
  try {
#ifndef FBJNI_NO_EXCEPTION_PTR
    auto exc = getJavaExceptionForCppException(std::current_exception());
#else
    auto exc = JUnknownCppException::create();
#endif
    setJavaExceptionAndAbortOnFailure(exc);
  } catch (...) {
#ifdef USE_LYRA
    FBLOGE("Unexpected error in translatePendingCppExceptionToJavaException(): %s",
        lyra::toString(std::current_exception()).c_str());
#endif
    std::terminate();
  }
}

// JniException ////////////////////////////////////////////////////////////////////////////////////

const std::string JniException::kExceptionMessageFailure_ = "Unable to get exception message.";

JniException::JniException() : JniException(JRuntimeException::create()) { }

JniException::JniException(alias_ref<jthrowable> throwable) : isMessageExtracted_(false) {
  throwable_ = make_global(throwable);
}

JniException::JniException(JniException &&rhs)
    : throwable_(std::move(rhs.throwable_)),
      what_(std::move(rhs.what_)),
      isMessageExtracted_(rhs.isMessageExtracted_) {
}

JniException::JniException(const JniException &rhs)
    : what_(rhs.what_), isMessageExtracted_(rhs.isMessageExtracted_) {
  throwable_ = make_global(rhs.throwable_);
}

JniException::~JniException() {
  try {
    ThreadScope ts;
    throwable_.reset();
  } catch (...) {
    FBLOGE("Exception in ~JniException()");
    std::terminate();
  }
}

local_ref<JThrowable> JniException::getThrowable() const noexcept {
  return make_local(throwable_);
}

// TODO 6900503: consider making this thread-safe.
void JniException::populateWhat() const noexcept {
  try {
    ThreadScope ts;
    what_ = throwable_->toString();
    isMessageExtracted_ = true;
  } catch(...) {
    what_ = kExceptionMessageFailure_;
  }
}

const char* JniException::what() const noexcept {
  if (!isMessageExtracted_) {
    populateWhat();
  }
  return what_.c_str();
}

void JniException::setJavaException() const noexcept {
  setJavaExceptionAndAbortOnFailure(throwable_);
}

}}
