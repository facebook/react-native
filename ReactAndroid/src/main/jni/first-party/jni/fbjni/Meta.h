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

#include "References.h"

namespace facebook {
namespace jni {

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
  friend class JObjectWrapper<jclass>;                                           \
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


/// JMethod specialization for references that wraps the return value in a @ref local_ref
template<typename T, typename... Args>
class JMethod<T*(Args...)> : public JMethodBase {
 public:
  static_assert(IsPlainJniReference<T*>(), "T* must be a JNI reference");

  using JMethodBase::JMethodBase;
  JMethod() noexcept {};
  JMethod(const JMethod& other) noexcept = default;

  /// Invoke a method and return a local reference wrapping the result
  local_ref<T*> operator()(alias_ref<jobject> self, Args... args);

  friend class JObjectWrapper<jclass>;
};


/// Convenience type representing constructors
template<typename F>
using JConstructor = JMethod<F>;

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
  friend class JObjectWrapper<jclass>;                                      \
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


/// JStaticMethod specialization for references that wraps the return value in a @ref local_ref
template<typename T, typename... Args>
class JStaticMethod<T*(Args...)> : public JMethodBase {
  static_assert(IsPlainJniReference<T*>(), "T* must be a JNI reference");

 public:
  using JMethodBase::JMethodBase;
  JStaticMethod() noexcept {};
  JStaticMethod(const JStaticMethod& other) noexcept = default;

  /// Invoke a method and return a local reference wrapping the result
  local_ref<T*> operator()(alias_ref<jclass> cls, Args... args);

  friend class JObjectWrapper<jclass>;
};

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
  TYPE operator()(alias_ref<jobject> self, jclass cls, Args... args);       \
                                                                            \
  friend class JObjectWrapper<jclass>;                                      \
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


/// JNonvirtualMethod specialization for references that wraps the return value in a @ref local_ref
template<typename T, typename... Args>
class JNonvirtualMethod<T*(Args...)> : public JMethodBase {
  static_assert(IsPlainJniReference<T*>(), "T* must be a JNI reference");

 public:
  using JMethodBase::JMethodBase;
  JNonvirtualMethod() noexcept {};
  JNonvirtualMethod(const JNonvirtualMethod& other) noexcept = default;

  /// Invoke a method and return a local reference wrapping the result
  local_ref<T*> operator()(alias_ref<jobject> self, jclass cls, Args... args);

  friend class JObjectWrapper<jclass>;
};


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

  friend class JObjectWrapper<jobject>;
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

  friend class JObjectWrapper<jclass>;

};


/// Type traits for Java types (currently providing Java type descriptors)
template<typename T>
struct jtype_traits;


/// Type traits for Java methods (currently providing Java type descriptors)
template<typename F>
struct jmethod_traits;

/// Template magic to provide @ref jmethod_traits
template<typename R, typename... Args>
struct jmethod_traits<R(Args...)> {
  static std::string descriptor();
  static std::string constructor_descriptor();
};

}}
