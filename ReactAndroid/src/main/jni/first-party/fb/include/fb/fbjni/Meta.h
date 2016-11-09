/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/** @file meta.h
 *
 * Provides wrappers for meta data such as methods and fields.
 */

#pragma once

#include <type_traits>
#include <string>

#include <jni.h>

#include "References-forward.h"

#ifdef __ANDROID__
# include <android/log.h>
# define XLOG_TAG "fb-jni"
# define XLOGV(...) __android_log_print(ANDROID_LOG_VERBOSE, XLOG_TAG, __VA_ARGS__)
# define XLOGD(...) __android_log_print(ANDROID_LOG_DEBUG, XLOG_TAG, __VA_ARGS__)
# define XLOGI(...) __android_log_print(ANDROID_LOG_INFO, XLOG_TAG, __VA_ARGS__)
# define XLOGW(...) __android_log_print(ANDROID_LOG_WARN, XLOG_TAG, __VA_ARGS__)
# define XLOGE(...) __android_log_print(ANDROID_LOG_ERROR, XLOG_TAG, __VA_ARGS__)
# define XLOGWTF(...) __android_log_print(ANDROID_LOG_FATAL, XLOG_TAG, __VA_ARGS__)
#endif

namespace facebook {
namespace jni {

// This will get the reflected Java Method from the method_id, get it's invoke
// method, and call the method via that. This shouldn't ever be needed, but
// Android 6.0 crashes when calling a method on a java.lang.Proxy via jni.
template <typename... Args>
local_ref<jobject> slowCall(jmethodID method_id, alias_ref<jobject> self, Args... args);

class JObject;


/// Wrapper of a jmethodID. Provides a common base for JMethod specializations
class JMethodBase {
 public:
  /// Verify that the method is valid
  explicit operator bool() const noexcept;

  /// Access the wrapped id
  jmethodID getId() const noexcept;

 protected:
  /// Create a wrapper of a method id
  explicit JMethodBase(jmethodID method_id = nullptr) noexcept;

 private:
  jmethodID method_id_;
};


/// Representation of a jmethodID
template<typename F>
class JMethod;

/// @cond INTERNAL
#pragma push_macro("DEFINE_PRIMITIVE_METHOD_CLASS")

#undef DEFINE_PRIMITIVE_METHOD_CLASS

// Defining JMethod specializations based on return value
#define DEFINE_PRIMITIVE_METHOD_CLASS(TYPE)                                      \
template<typename... Args>                                                       \
class JMethod<TYPE(Args...)> : public JMethodBase {                              \
 public:                                                                         \
  static_assert(std::is_void<TYPE>::value || IsJniPrimitive<TYPE>(),             \
      "TYPE must be primitive or void");                                         \
                                                                                 \
  using JMethodBase::JMethodBase;                                                \
  JMethod() noexcept {};                                                         \
  JMethod(const JMethod& other) noexcept = default;                              \
                                                                                 \
  TYPE operator()(alias_ref<jobject> self, Args... args);                        \
                                                                                 \
  friend class JClass;                                                           \
}

DEFINE_PRIMITIVE_METHOD_CLASS(void);
DEFINE_PRIMITIVE_METHOD_CLASS(jboolean);
DEFINE_PRIMITIVE_METHOD_CLASS(jbyte);
DEFINE_PRIMITIVE_METHOD_CLASS(jchar);
DEFINE_PRIMITIVE_METHOD_CLASS(jshort);
DEFINE_PRIMITIVE_METHOD_CLASS(jint);
DEFINE_PRIMITIVE_METHOD_CLASS(jlong);
DEFINE_PRIMITIVE_METHOD_CLASS(jfloat);
DEFINE_PRIMITIVE_METHOD_CLASS(jdouble);

#pragma pop_macro("DEFINE_PRIMITIVE_METHOD_CLASS")
/// @endcond


/// Convenience type representing constructors
/// These should only be used with JClass::getConstructor and JClass::newObject.
template<typename F>
struct JConstructor : private JMethod<F> {
  using JMethod<F>::JMethod;
 private:
  JConstructor(const JMethod<F>& other) : JMethod<F>(other.getId()) {}
  friend class JClass;
};

/// Representation of a jStaticMethodID
template<typename F>
class JStaticMethod;

/// @cond INTERNAL
#pragma push_macro("DEFINE_PRIMITIVE_STATIC_METHOD_CLASS")

#undef DEFINE_PRIMITIVE_STATIC_METHOD_CLASS

// Defining JStaticMethod specializations based on return value
#define DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(TYPE)                          \
template<typename... Args>                                                  \
class JStaticMethod<TYPE(Args...)> : public JMethodBase {                   \
  static_assert(std::is_void<TYPE>::value || IsJniPrimitive<TYPE>(),        \
      "T must be a JNI primitive or void");                                 \
                                                                            \
 public:                                                                    \
  using JMethodBase::JMethodBase;                                           \
  JStaticMethod() noexcept {};                                              \
  JStaticMethod(const JStaticMethod& other) noexcept = default;             \
                                                                            \
  TYPE operator()(alias_ref<jclass> cls, Args... args);                     \
                                                                            \
  friend class JClass;                                                      \
}

DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(void);
DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(jboolean);
DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(jbyte);
DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(jchar);
DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(jshort);
DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(jint);
DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(jlong);
DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(jfloat);
DEFINE_PRIMITIVE_STATIC_METHOD_CLASS(jdouble);

#pragma pop_macro("DEFINE_PRIMITIVE_STATIC_METHOD_CLASS")
/// @endcond


/// Representation of a jNonvirtualMethodID
template<typename F>
class JNonvirtualMethod;

/// @cond INTERNAL
#pragma push_macro("DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS")

#undef DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS

// Defining JNonvirtualMethod specializations based on return value
#define DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(TYPE)                     \
template<typename... Args>                                                  \
class JNonvirtualMethod<TYPE(Args...)> : public JMethodBase {               \
  static_assert(std::is_void<TYPE>::value || IsJniPrimitive<TYPE>(),        \
      "T must be a JNI primitive or void");                                 \
                                                                            \
 public:                                                                    \
  using JMethodBase::JMethodBase;                                           \
  JNonvirtualMethod() noexcept {};                                          \
  JNonvirtualMethod(const JNonvirtualMethod& other) noexcept = default;     \
                                                                            \
  TYPE operator()(alias_ref<jobject> self, alias_ref<jclass> cls, Args... args);       \
                                                                            \
  friend class JClass;                                                      \
}

DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(void);
DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(jboolean);
DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(jbyte);
DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(jchar);
DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(jshort);
DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(jint);
DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(jlong);
DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(jfloat);
DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS(jdouble);

#pragma pop_macro("DEFINE_PRIMITIVE_NON_VIRTUAL_METHOD_CLASS")
/// @endcond


/**
 * JField represents typed fields and simplifies their access. Note that object types return
 * raw pointers which generally should promptly get a wrap_local treatment.
 */
template<typename T>
class JField {
  static_assert(IsJniScalar<T>(), "T must be a JNI scalar");

 public:
  /// Wraps an existing field id
  explicit JField(jfieldID field = nullptr) noexcept;

  /// Verify that the id is valid
  explicit operator bool() const noexcept;

  /// Access the wrapped id
  jfieldID getId() const noexcept;

 private:
  jfieldID field_id_;

  /// Get field value
  /// @pre object != nullptr
  T get(jobject object) const noexcept;

  /// Set field value
  /// @pre object != nullptr
  void set(jobject object, T value) noexcept;

  friend class JObject;
};


/**
 * JStaticField represents typed fields and simplifies their access. Note that object types
 * return raw pointers which generally should promptly get a wrap_local treatment.
 */
template<typename T>
class JStaticField {
  static_assert(IsJniScalar<T>(), "T must be a JNI scalar");

 public:
  /// Wraps an existing field id
  explicit JStaticField(jfieldID field = nullptr) noexcept;

  /// Verify that the id is valid
  explicit operator bool() const noexcept;

  /// Access the wrapped id
  jfieldID getId() const noexcept;

 private:
  jfieldID field_id_;

  /// Get field value
  /// @pre object != nullptr
  T get(jclass jcls) const noexcept;

  /// Set field value
  /// @pre object != nullptr
  void set(jclass jcls, T value) noexcept;

  friend class JClass;
  friend class JObject;
};


/// Template magic to provide @ref jmethod_traits
template<typename R, typename... Args>
struct jmethod_traits<R(Args...)> {
  static std::string descriptor();
  static std::string constructor_descriptor();
};


// jtype_traits ////////////////////////////////////////////////////////////////////////////////////

template<typename T>
struct jtype_traits {
private:
  using Repr = ReprType<T>;
public:
  // The jni type signature (described at
  // http://docs.oracle.com/javase/1.5.0/docs/guide/jni/spec/types.html).
  static std::string descriptor() {
    std::string descriptor;
    if (Repr::kJavaDescriptor == nullptr) {
      descriptor = Repr::get_instantiated_java_descriptor();
    } else {
      descriptor = Repr::kJavaDescriptor;
    }
    return descriptor;
  }

  // The signature used for class lookups. See
  // http://docs.oracle.com/javase/6/docs/api/java/lang/Class.html#getName().
  static std::string base_name() {
    if (Repr::kJavaDescriptor != nullptr) {
      std::string base_name = Repr::kJavaDescriptor;
      return base_name.substr(1, base_name.size() - 2);
    }
    return Repr::get_instantiated_base_name();
  }
};

#pragma push_macro("DEFINE_FIELD_AND_ARRAY_TRAIT")
#undef DEFINE_FIELD_AND_ARRAY_TRAIT

#define DEFINE_FIELD_AND_ARRAY_TRAIT(TYPE, DSC)                     \
template<>                                                          \
struct jtype_traits<TYPE> {                                         \
  static std::string descriptor() { return std::string{#DSC}; }     \
  static std::string base_name() { return descriptor(); }           \
  using array_type = TYPE ## Array;                                 \
};                                                                  \
template<>                                                          \
struct jtype_traits<TYPE ## Array> {                                \
  static std::string descriptor() { return std::string{"[" #DSC}; } \
  static std::string base_name() { return descriptor(); }           \
  using entry_type = TYPE;                                          \
};

// There is no voidArray, handle that without the macro.
template<>
struct jtype_traits<void> {
  static std::string descriptor() { return std::string{"V"}; };
};

DEFINE_FIELD_AND_ARRAY_TRAIT(jboolean, Z)
DEFINE_FIELD_AND_ARRAY_TRAIT(jbyte,    B)
DEFINE_FIELD_AND_ARRAY_TRAIT(jchar,    C)
DEFINE_FIELD_AND_ARRAY_TRAIT(jshort,   S)
DEFINE_FIELD_AND_ARRAY_TRAIT(jint,     I)
DEFINE_FIELD_AND_ARRAY_TRAIT(jlong,    J)
DEFINE_FIELD_AND_ARRAY_TRAIT(jfloat,   F)
DEFINE_FIELD_AND_ARRAY_TRAIT(jdouble,  D)

#pragma pop_macro("DEFINE_FIELD_AND_ARRAY_TRAIT")


template <typename T>
struct jmethod_traits_from_cxx;

}}

#include "Meta-inl.h"
