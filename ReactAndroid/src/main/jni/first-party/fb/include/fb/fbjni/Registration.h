/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jni.h>
#include "References.h"

namespace facebook {
namespace jni {

namespace detail {

// This uses the real JNI function as a non-type template parameter to
// cause a (static member) function to exist with the same signature,
// but with try/catch exception translation.
template<typename F, F func, typename C, typename R, typename... Args>
NativeMethodWrapper* exceptionWrapJNIMethod(R (*func0)(JNIEnv*, jobject, Args... args));

// Automatically wrap object argument, and don't take env explicitly.
template<typename F, F func, typename C, typename R, typename... Args>
NativeMethodWrapper* exceptionWrapJNIMethod(R (*func0)(alias_ref<C>, Args... args));

// Extract C++ instance from object, and invoke given method on it,
template<typename M, M method, typename C, typename R, typename... Args>
NativeMethodWrapper* exceptionWrapJNIMethod(R (C::*method0)(Args... args));

// This uses deduction to figure out the descriptor name if the types
// are primitive or have JObjectWrapper specializations.
template<typename R, typename C, typename... Args>
std::string makeDescriptor(R (*func)(JNIEnv*, C, Args... args));

// This uses deduction to figure out the descriptor name if the types
// are primitive or have JObjectWrapper specializations.
template<typename R, typename C, typename... Args>
std::string makeDescriptor(R (*func)(alias_ref<C>, Args... args));

// This uses deduction to figure out the descriptor name if the types
// are primitive or have JObjectWrapper specializations.
template<typename R, typename C, typename... Args>
std::string makeDescriptor(R (C::*method0)(Args... args));

}

// We have to use macros here, because the func needs to be used
// as both a decltype expression argument and as a non-type template
// parameter, since C++ provides no way for translateException
// to deduce the type of its non-type template parameter.
// The empty string in the macros below ensures that name
// is always a string literal (because that syntax is only
// valid when name is a string literal).
#define makeNativeMethod2(name, func)                                   \
  { name "", ::facebook::jni::detail::makeDescriptor(&func),            \
      ::facebook::jni::detail::exceptionWrapJNIMethod<decltype(&func), &func>(&func) }

#define makeNativeMethod3(name, desc, func)                             \
  { name "", desc,                                                      \
      ::facebook::jni::detail::exceptionWrapJNIMethod<decltype(&func), &func>(&func) }

// Variadic template hacks to get macros with different numbers of
// arguments. Usage instructions are in CoreClasses.h.
#define makeNativeMethodN(a, b, c, count, ...) makeNativeMethod ## count
#define makeNativeMethod(...) makeNativeMethodN(__VA_ARGS__, 3, 2)(__VA_ARGS__)

}}

#include "Registration-inl.h"
