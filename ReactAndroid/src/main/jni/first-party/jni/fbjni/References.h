/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */


/** @file References.h
 *
 * Functionality similar to smart pointers, but for references into the VM. Four main reference
 * types are provided: local_ref, global_ref, weak_ref, and alias_ref. All are generic
 * templates that and refer to objects in the jobject hierarchy. The type of the referred objects
 * are specified using the template parameter. All reference types except alias_ref own their
 * underlying reference, just as a std smart pointer owns the underlying raw pointer. In the context
 * of std smart pointers, these references behave like unique_ptr, and have basically the same
 * interface. Thus, when the reference is destructed, the plain JNI reference, i.e. the underlying
 * JNI reference (like the parameters passed directly to JNI functions), is released. The alias
 * references provides no ownership and is a simple wrapper for plain JNI references.
 *
 * All but the weak references provides access to the underlying object using dereferencing, and a
 * get() method. It is also possible to convert these references to booleans to test for nullity.
 * To access the underlying object of a weak reference, the reference must either be released, or
 * the weak reference can be used to create a local or global reference.
 *
 * An owning reference is created either by moving the reference from an existing owned reference,
 * by copying an existing owned reference (which creates a new underlying reference), by using the
 * default constructor which initialize the reference to nullptr, or by using a helper function. The
 * helper function exist in two flavors: make_XXX or adopt_XXX.
 *
 * Adopting takes a plain JNI reference and wrap it in an owned reference. It takes ownership of the
 * plain JNI reference so be sure that no one else owns the reference when you adopt it, and make
 * sure that you know what kind of reference it is.
 *
 * New owned references can be created from existing plain JNI references, alias references, local
 * references, and global references (i.e. non-weak references) using the make_local, make_global,
 * and make_weak functions.
 *
 * Alias references can be implicitly initialized using global, local and plain JNI references using
 * the wrap_alias function. Here, we don't assume ownership of the passed-in reference, but rather
 * create a separate reference that we do own, leaving the passed-in reference to its fate.
 *
 * Similar rules apply for assignment. An owned reference can be copy or move assigned using a smart
 * reference of the same type. In the case of copy assignment a new reference is created. Alias
 * reference can also be assigned new values, but since they are simple wrappers of plain JNI
 * references there is no move semantics involved.
 *
 * Alias references are special in that they do not own the object and can therefore safely be
 * converted to and from its corresponding plain JNI reference. They are useful as parameters of
 * functions that do not affect the lifetime of a reference. Usage can be compared with using plain
 * JNI pointers as parameters where a function does not take ownership of the underlying object.
 *
 * The local, global, and alias references makes it possible to access methods in the underlying
 * objects. A core set of classes are implemented in CoreClasses.h, and user defined wrappers are
 * supported (see example below). The wrappers also supports inheritance so a wrapper can inherit
 * from another wrapper to gain access to its functionality. As an example the jstring wrapper
 * inherits from the jobject wrapper, so does the jclass wrapper. That means that you can for
 * example call the toString() method using the jclass wrapper, or any other class that inherits
 * from the jobject wrapper.
 *
 * Note that the wrappers are parameterized on the static type of your (jobject) pointer, thus if
 * you have a jobject that refers to a Java String you will need to cast it to jstring to get the
 * jstring wrapper. This also mean that if you make a down cast that is invalid there will be no one
 * stopping you and the wrappers currently does not detect this which can cause crashes. Thus, cast
 * wisely.
 *
 * @include WrapperSample.cpp
 */

#pragma once

#include <cassert>
#include <cstddef>
#include <type_traits>

#include <jni.h>

#include "ReferenceAllocators.h"
#include "TypeTraits.h"

namespace facebook {
namespace jni {

/**
 * The JObjectWrapper is specialized to provide functionality for various Java classes, some
 * specializations are provided, and it is easy to add your own. See example
 * @sample WrapperSample.cpp
 */
template<typename T, typename Enable = void>
class JObjectWrapper;


template<typename T, typename Alloc>
class base_owned_ref;

template<typename T, typename Alloc>
class basic_strong_ref;

template<typename T>
class weak_ref;

template<typename T>
class alias_ref;


/// A smart unique reference owning a local JNI reference
template<typename T>
using local_ref = basic_strong_ref<T, LocalReferenceAllocator>;

/// A smart unique reference owning a global JNI reference
template<typename T>
using global_ref = basic_strong_ref<T, GlobalReferenceAllocator>;


/// Convenience function to wrap an existing local reference
template<typename T>
enable_if_t<IsPlainJniReference<T>(), local_ref<T>> adopt_local(T ref) noexcept;

/// Convenience function to wrap an existing global reference
template<typename T>
enable_if_t<IsPlainJniReference<T>(), global_ref<T>> adopt_global(T ref) noexcept;

/// Convenience function to wrap an existing weak reference
template<typename T>
enable_if_t<IsPlainJniReference<T>(), weak_ref<T>> adopt_weak_global(T ref) noexcept;


/**
 * Create a new local reference from an existing reference
 *
 * @param ref a plain JNI, alias, or strong reference
 * @return an owned local reference (referring to null if the input does)
 * @throws std::bad_alloc if the JNI reference could not be created
 */
template<typename T>
enable_if_t<IsNonWeakReference<T>(), local_ref<plain_jni_reference_t<T>>>
make_local(const T& r);

/**
 * Create a new global reference from an existing reference
 *
 * @param ref a plain JNI, alias, or strong reference
 * @return an owned global reference (referring to null if the input does)
 * @throws std::bad_alloc if the JNI reference could not be created
 */
template<typename T>
enable_if_t<IsNonWeakReference<T>(), global_ref<plain_jni_reference_t<T>>>
make_global(const T& r);

/**
 * Create a new weak global reference from an existing reference
 *
 * @param ref a plain JNI, alias, or strong reference
 * @return an owned weak global reference (referring to null if the input does)
 * @throws std::bad_alloc if the returned reference is null
 */
template<typename T>
enable_if_t<IsNonWeakReference<T>(), weak_ref<plain_jni_reference_t<T>>>
make_weak(const T& r);


/// Swaps two owning references of the same type
template<typename T>
void swap(weak_ref<T>& a, weak_ref<T>& b) noexcept;

/// Swaps two owning references of the same type
template<typename T, typename Alloc>
void swap(basic_strong_ref<T, Alloc>& a, basic_strong_ref<T, Alloc>& b) noexcept;

/**
 * Retrieve the plain reference from a plain reference.
 */
template<typename T>
enable_if_t<IsPlainJniReference<T>(), T> getPlainJniReference(T ref);

/**
 * Retrieve the plain reference from an alias reference.
 */
template<typename T>
T getPlainJniReference(alias_ref<T> ref);

/**
 * Retrieve the plain JNI reference from any reference owned reference.
 */
template<typename T, typename Alloc>
T getPlainJniReference(const base_owned_ref<T, Alloc>& ref);

/**
 * Compare two references to see if they refer to the same object
 */
template<typename T1, typename T2>
enable_if_t<IsNonWeakReference<T1>() && IsNonWeakReference<T2>(), bool>
operator==(const T1& a, const T2& b);

/**
 * Compare two references to see if they don't refer to the same object
 */
template<typename T1, typename T2>
enable_if_t<IsNonWeakReference<T1>() && IsNonWeakReference<T2>(), bool>
operator!=(const T1& a, const T2& b);


template<typename T, typename Alloc>
class base_owned_ref {

  static_assert(IsPlainJniReference<T>(), "T must be a JNI reference");

 public:

  /**
   * Release the ownership and set the reference to null. Thus no deleter is invoked.
   * @return Returns the reference
   */
  T release() noexcept;

  /**
   * Reset the reference to refer to nullptr.
   */
  void reset() noexcept;

 protected:

  JObjectWrapper<T> object_;

  /*
   * Wrap an existing reference and transfers its ownership to the newly created unique reference.
   * NB! Does not create a new reference
   */
  explicit base_owned_ref(T reference) noexcept;

  /// Create a null reference
  constexpr base_owned_ref() noexcept;

  /// Create a null reference
  constexpr explicit base_owned_ref(std::nullptr_t) noexcept;

  /// Copy constructor (note creates a new reference)
  base_owned_ref(const base_owned_ref& other);
  template<typename U>
  base_owned_ref(const base_owned_ref<U, Alloc>& other);

  /// Transfers ownership of an underlying reference from one unique reference to another
  base_owned_ref(base_owned_ref&& other) noexcept;
  template<typename U>
  base_owned_ref(base_owned_ref<U, Alloc>&& other) noexcept;

  /// The delete the underlying reference if applicable
  ~base_owned_ref() noexcept;


  /// Assignment operator (note creates a new reference)
  base_owned_ref& operator=(const base_owned_ref& other);

  /// Assignment by moving a reference thus not creating a new reference
  base_owned_ref& operator=(base_owned_ref&& rhs) noexcept;


  T getPlainJniReference() const noexcept;

  void reset(T reference) noexcept;


  friend T jni::getPlainJniReference<>(const base_owned_ref& ref);

  template<typename U, typename UAlloc>
  friend class base_owned_ref;
};


/**
 * A smart reference that owns its underlying JNI reference. The class provides basic
 * functionality to handle a reference but gives no access to it unless the reference is
 * released, thus no longer owned. The API is stolen with pride from unique_ptr and the
 * semantics should be basically the same. This class should not be used directly, instead use
 * @ref weak_ref
 */
template<typename T>
class weak_ref : public base_owned_ref<T, WeakGlobalReferenceAllocator> {

  static_assert(IsPlainJniReference<T>(), "T must be a JNI reference");

 public:

  using PlainJniType = T;
  using Allocator = WeakGlobalReferenceAllocator;

  // This inherits non-default, non-copy, non-move ctors.
  using base_owned_ref<T, Allocator>::base_owned_ref;

  /// Create a null reference
  constexpr weak_ref() noexcept
    : base_owned_ref<T, Allocator>{} {}

  /// Create a null reference
  constexpr explicit weak_ref(std::nullptr_t) noexcept
    : base_owned_ref<T, Allocator>{nullptr} {}

  /// Copy constructor (note creates a new reference)
  weak_ref(const weak_ref& other)
    : base_owned_ref<T, Allocator>{other} {}

  /// Transfers ownership of an underlying reference from one unique reference to another
  weak_ref(weak_ref&& other) noexcept
    : base_owned_ref<T, Allocator>{std::move(other)} {}


  /// Assignment operator (note creates a new reference)
  weak_ref& operator=(const weak_ref& other);

  /// Assignment by moving a reference thus not creating a new reference
  weak_ref& operator=(weak_ref&& rhs) noexcept;


  // Creates an owned local reference to the referred object or to null if the object is reclaimed
  local_ref<T> lockLocal();

  // Creates an owned global reference to the referred object or to null if the object is reclaimed
  global_ref<T> lockGlobal();

 private:

  using base_owned_ref<T, Allocator>::getPlainJniReference;

  /*
   * Wrap an existing reference and transfers its ownership to the newly created unique reference.
   * NB! Does not create a new reference
   */
  explicit weak_ref(T reference) noexcept
    : base_owned_ref<T, Allocator>{reference} {}


  template<typename T2> friend class weak_ref;
  friend weak_ref<enable_if_t<IsPlainJniReference<T>(), T>>
    adopt_weak_global<T>(T ref) noexcept;
  friend void swap<T>(weak_ref& a, weak_ref& b) noexcept;
};


/**
 * A class representing owned strong references to Java objects. This class
 * should not be used directly, instead use @ref local_ref, or @ref global_ref.
 */
template<typename T, typename Alloc>
class basic_strong_ref : public base_owned_ref<T, Alloc> {

  static_assert(IsPlainJniReference<T>(), "T must be a JNI reference");

 public:

  using PlainJniType = T;
  using Allocator = Alloc;

  // This inherits non-default, non-copy, non-move ctors.
  using base_owned_ref<T, Alloc>::base_owned_ref;
  using base_owned_ref<T, Alloc>::release;
  using base_owned_ref<T, Alloc>::reset;

  /// Create a null reference
  constexpr basic_strong_ref() noexcept
    : base_owned_ref<T, Alloc>{} {}

  /// Create a null reference
  constexpr explicit basic_strong_ref(std::nullptr_t) noexcept
    : base_owned_ref<T, Alloc>{nullptr} {}

  /// Copy constructor (note creates a new reference)
  basic_strong_ref(const basic_strong_ref& other)
    : base_owned_ref<T, Alloc>{other} {}

  /// Transfers ownership of an underlying reference from one unique reference to another
  basic_strong_ref(basic_strong_ref&& other) noexcept
    : base_owned_ref<T, Alloc>{std::move(other)} {}

  /// Assignment operator (note creates a new reference)
  basic_strong_ref& operator=(const basic_strong_ref& other);

  /// Assignment by moving a reference thus not creating a new reference
  basic_strong_ref& operator=(basic_strong_ref&& rhs) noexcept;


  /// Release the ownership of the reference and return the wrapped reference in an alias
  alias_ref<T> releaseAlias() noexcept;

  /// Checks if the reference points to a non-null object
  explicit operator bool() const noexcept;

  /// Get the plain JNI reference
  T get() const noexcept;

  /// Access the functionality provided by the object wrappers
  JObjectWrapper<T>* operator->() noexcept;

  /// Access the functionality provided by the object wrappers
  const JObjectWrapper<T>* operator->() const noexcept;

  /// Provide a reference to the underlying wrapper (be sure that it is non-null before invoking)
  JObjectWrapper<T>& operator*() noexcept;

  /// Provide a const reference to the underlying wrapper (be sure that it is non-null
  /// before invoking)
  const JObjectWrapper<T>& operator*() const noexcept;

 private:

  using base_owned_ref<T, Alloc>::object_;
  using base_owned_ref<T, Alloc>::getPlainJniReference;

  /*
   * Wrap an existing reference and transfers its ownership to the newly created unique reference.
   * NB! Does not create a new reference
   */
  explicit basic_strong_ref(T reference) noexcept
    : base_owned_ref<T, Alloc>{reference} {}


  friend enable_if_t<IsPlainJniReference<T>(), local_ref<T>> adopt_local<T>(T ref) noexcept;
  friend enable_if_t<IsPlainJniReference<T>(), global_ref<T>> adopt_global<T>(T ref) noexcept;
  friend void swap<T, Alloc>(basic_strong_ref& a, basic_strong_ref& b) noexcept;
};


template<typename T>
enable_if_t<IsPlainJniReference<T>(), alias_ref<T>> wrap_alias(T ref) noexcept;

/// Swaps to alias referencec of the same type
template<typename T>
void swap(alias_ref<T>& a, alias_ref<T>& b) noexcept;

/**
 * A non-owning variant of the smart references (a dumb reference). These references still provide
 * access to the functionality of the @ref JObjectWrapper specializations including exception
 * handling and ease of use. Use this representation when you don't want to claim ownership of the
 * underlying reference (compare to using raw pointers instead of smart pointers.) For symmetry use
 * @ref alias_ref instead of this class.
 */
template<typename T>
class alias_ref {

  static_assert(IsPlainJniReference<T>(), "T must be a JNI reference");

 public:

  using PlainJniType = T;


  /// Create a null reference
  constexpr alias_ref() noexcept;

  /// Create a null reference
  constexpr alias_ref(std::nullptr_t) noexcept;

  /// Copy constructor
  alias_ref(const alias_ref& other) noexcept;

  /// Wrap an existing plain JNI reference
  alias_ref(T ref) noexcept;

  /// Wrap an existing smart reference of any type convertible to T
  template<typename TOther, typename = enable_if_t<IsConvertible<TOther, T>(), T>>
  alias_ref(alias_ref<TOther> other) noexcept;

  /// Wrap an existing alias reference of a type convertible to T
  template<typename TOther, typename AOther, typename = enable_if_t<IsConvertible<TOther, T>(), T>>
  alias_ref(const basic_strong_ref<TOther, AOther>& other) noexcept;


  /// Assignment operator
  alias_ref& operator=(alias_ref other) noexcept;

  /// Checks if the reference points to a non-null object
  explicit operator bool() const noexcept;

  /// Converts back to a plain JNI reference
  T get() const noexcept;

  /// Access the functionality provided by the object wrappers
  JObjectWrapper<T>* operator->() noexcept;

  /// Access the functionality provided by the object wrappers
  const JObjectWrapper<T>* operator->() const noexcept;

  /// Provide a guaranteed non-null reference (be sure that it is non-null before invoking)
  JObjectWrapper<T>& operator*() noexcept;

  /// Provide a guaranteed non-null reference (be sure that it is non-null before invoking)
  const JObjectWrapper<T>& operator*() const noexcept;

 private:
  JObjectWrapper<T> object_;

  friend void swap<T>(alias_ref& a, alias_ref& b) noexcept;
};


/**
 * RAII object to create a local JNI frame, using PushLocalFrame/PopLocalFrame.
 *
 * This is useful when you have a call which is initiated from C++-land, and therefore
 * doesn't automatically get a local JNI frame managed for you by the JNI framework.
 */
class JniLocalScope {
public:
  JniLocalScope(JNIEnv* p_env, jint capacity);
  ~JniLocalScope();

private:
  JNIEnv* env_;
  bool hasFrame_;
};

}}

#include "References-inl.h"
