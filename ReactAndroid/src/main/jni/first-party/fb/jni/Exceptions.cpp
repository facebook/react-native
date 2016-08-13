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

// TODO(T6618159) Take a stack dump here to save context if it results in a crash when propagated
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

// Translate C++ to Java Exception

namespace {

// The implementation std::rethrow_if_nested uses a dynamic_cast to determine
// if the exception is a nested_exception. If the exception is from a library
// built with -fno-rtti, then that will crash. This avoids that.
void rethrow_if_nested() {
  try {
    throw;
  } catch (const std::nested_exception& e) {
    e.rethrow_nested();
  } catch (...) {
  }
}

// For each exception in the chain of the currently handled exception, func
// will be called with that exception as the currently handled exception (in
// reverse order, i.e. innermost first).
void denest(std::function<void()> func) {
  try {
    throw;
  } catch (const std::exception& e) {
    try {
      rethrow_if_nested();
    } catch (...) {
      denest(func);
    }
    func();
  } catch (...) {
    func();
  }
}
}

void translatePendingCppExceptionToJavaException() noexcept {
  local_ref<JThrowable> previous;
  auto func = [&previous] () {
    local_ref<JThrowable> current;
    try {
      throw;
    } catch(const JniException& ex) {
      current = ex.getThrowable();
    } catch(const std::ios_base::failure& ex) {
      current = JIOException::create(ex.what());
    } catch(const std::bad_alloc& ex) {
      current = JOutOfMemoryError::create(ex.what());
    } catch(const std::out_of_range& ex) {
      current = JArrayIndexOutOfBoundsException::create(ex.what());
    } catch(const std::system_error& ex) {
      current = JCppSystemErrorException::create(ex);
    } catch(const std::runtime_error& ex) {
      current = JRuntimeException::create(ex.what());
    } catch(const std::exception& ex) {
      current = JCppException::create(ex.what());
    } catch(const char* msg) {
      current = JUnknownCppException::create(msg);
    } catch(...) {
      current = JUnknownCppException::create();
    }
    if (previous) {
      current->initCause(previous);
    }
    previous = current;
  };

  try {
    denest(func);
    setJavaExceptionAndAbortOnFailure(previous);
  } catch (std::exception& e) {
    FBLOGE("unexpected exception in translatePendingCppExceptionToJavaException: %s", e.what());
    // rethrow the exception and let the noexcept handling abort.
    throw;
  } catch (...) {
    FBLOGE("unexpected exception in translatePendingCppExceptionToJavaException");
    throw;
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
  ThreadScope ts;
  throwable_.reset();
}

local_ref<JThrowable> JniException::getThrowable() const noexcept {
  return make_local(throwable_);
}

// TODO 6900503: consider making this thread-safe.
void JniException::populateWhat() const noexcept {
  ThreadScope ts;
  try {
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
