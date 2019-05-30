/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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

template<typename F>
struct CriticalMethod;

template<typename R, typename ...Args>
struct CriticalMethod<R(*)(Args...)> {
  template<R(*func)(Args...)>
  static R call(alias_ref<jclass>, Args... args);

  template<R(*func)(Args...)>
  inline static std::string desc();
};

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


// FAST CALLS / CRITICAL CALLS
// Android up to and including v7 supports "fast calls" by prefixing the method
// signature with an exclamation mark.
// Android v8+ supports fast calls by annotating methods:
// https://source.android.com/devices/tech/dalvik/improvements#faster-native-methods
//
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
//
// "Fast" calls are only on the order of a few dozen NANO-seconds faster than
// regular JNI calls. If your method does almost aaanything of consequence - if
// you loop, if you write to a log, if you call another method, if you even
// simply allocate or deallocate - then the method body will significantly
// outweigh the method overhead.
//
// The difference between a regular JNI method and a "FastJNI" method (as
// they're called inside the runtime) is that a FastJNI method doesn't mark the
// thread as executing native code, and by skipping that avoids the locking and
// thread state check overhead of interacting with the Garbage Collector.
//
// To understand why this is dangerous, you need to understand a bit about the
// GC. In order to perform its work the GC needs to have at least one (usually
// two in modern implementations) "stop the world" checkpoints where it can
// guarantee that all managed-code execution is paused. The VM performs these
// checkpoints at allocations, method boundaries, and each backward branch (ie
// anytime you loop). When the GC wants to run, it will signal to all managed
// threads that they should pause at the next checkpoint, and then it will wait
// for every thread in the system to transition from the "runnable" state into a
// "waiting" state. Once every thread has stopped, the GC thread can perform the
// work it needs to and then it will trigger the execution threads to resume.
//
// JNI methods fit neatly into the above paradigm: They're still methods, so
// they perform GC checkpoints at method entry and method exit. JNI methods also
// perform checkpoints at any JNI boundary crossing - ie, any time you call
// GetObjectField etc. Because access to managed objects from native code is
// tightly controlled, the VM is able to mark threads executing native methods
// into a special "native" state which the GC is able to ignore: It knows they
// can't touch managed objects (without hitting a checkpoint) so it doesn't care
// about them.
//
// JNI critical methods don't perform that "runnable" -> "native" thread state
// transition. Skipping that transition allows them to shave about 20ns off
// their total execution time, but it means that the GC has to wait for them to
// complete before it can move forward. If a critical method begins blocking,
// say on a long loop, or an I/O operation, or on perhaps a mutex, then the GC
// will also block, and because the GC is blocking the entire rest of the VM
// (which is waiting on the GC) will block. If the critical method is blocking
// on a mutex that's already held by the GC - for example, the VM's internal
// weak_globals_lock_ which guards modifications to the weak global reference
// table (and is required in order to create or free a weak_ref<>) - then you
// have a system-wide deadlock.

// prefixes a JNI method signature as android "fast call".
#if defined(__ANDROID__) && defined(FBJNI_WITH_FAST_CALLS)
#define FBJNI_PREFIX_FAST_CALL(desc) (std::string{"!"} + desc)
#else
#define FBJNI_PREFIX_FAST_CALL(desc) (desc)
#endif

#define makeCriticalNativeMethod3(name, desc, func) \
  makeNativeMethod3(                                \
    name,                                           \
    FBJNI_PREFIX_FAST_CALL(desc),                   \
    ::facebook::jni::detail::CriticalMethod<decltype(&func)>::call<&func>)

#define makeCriticalNativeMethod2(name, func)                                \
  makeCriticalNativeMethod3(                                                 \
    name,                                                                    \
    ::facebook::jni::detail::CriticalMethod<decltype(&func)>::desc<&func>(), \
    func)

#define makeCriticalNativeMethodN(a, b, c, count, ...) makeCriticalNativeMethod ## count

// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// YOU ALMOST CERTAINLY DO NOT NEED THIS AND IT IS DANGEROUS.
// See above for an explanation.
#define makeCriticalNativeMethod_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(...) makeCriticalNativeMethodN(__VA_ARGS__, 3, 2)(__VA_ARGS__)

}}

#include "Registration-inl.h"
