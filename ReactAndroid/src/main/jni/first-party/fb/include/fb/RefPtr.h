/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <utility>
#include <fb/assert.h>

namespace facebook {

// Reference counting smart pointer. This is designed to work with the
// Countable class or other implementations in the future. It is designed in a
// way to be both efficient and difficult to misuse. Typical usage is very
// simple once you learn the patterns (and the compiler will help!):
//
// By default, the internal pointer is null.
//   RefPtr<Foo> ref;
//
// Object creation requires explicit construction:
//   RefPtr<Foo> ref = createNew<Foo>(...);
//
// Or if the constructor is not public:
//   RefPtr<Foo> ref = adoptRef(new Foo(...));
//
// But you can implicitly create from nullptr:
//   RefPtr<Foo> maybeRef = cond ? ref : nullptr;
//
// Move/Copy Construction/Assignment are straightforward:
//   RefPtr<Foo> ref2 = ref;
//   ref = std::move(ref2);
//
// Destruction automatically drops the RefPtr's reference as expected.
//
// Upcasting is implicit but downcasting requires an explicit cast:
//   struct Bar : public Foo {};
//   RefPtr<Bar> barRef = static_cast<RefPtr<Bar>>(ref);
//   ref = barRef;
//
template <class T>
class RefPtr {
public:
  constexpr RefPtr() :
    m_ptr(nullptr)
  {}

  // Allow implicit construction from a pointer only from nullptr
  constexpr RefPtr(std::nullptr_t ptr) :
    m_ptr(nullptr)
  {}

  RefPtr(const RefPtr<T>& ref) :
    m_ptr(ref.m_ptr)
  {
    refIfNecessary(m_ptr);
  }

  // Only allow implicit upcasts. A downcast will result in a compile error
  // unless you use static_cast (which will end up invoking the explicit
  // operator below).
  template <typename U>
  RefPtr(const RefPtr<U>& ref, typename std::enable_if<std::is_base_of<T,U>::value, U>::type* = nullptr) :
    m_ptr(ref.get())
  {
    refIfNecessary(m_ptr);
  }

  RefPtr(RefPtr<T>&& ref) :
    m_ptr(nullptr)
  {
    *this = std::move(ref);
  }

  // Only allow implicit upcasts. A downcast will result in a compile error
  // unless you use static_cast (which will end up invoking the explicit
  // operator below).
  template <typename U>
  RefPtr(RefPtr<U>&& ref, typename std::enable_if<std::is_base_of<T,U>::value, U>::type* = nullptr) :
    m_ptr(nullptr)
  {
    *this = std::move(ref);
  }

  ~RefPtr() {
    unrefIfNecessary(m_ptr);
    m_ptr = nullptr;
  }

  RefPtr<T>& operator=(const RefPtr<T>& ref) {
    if (m_ptr != ref.m_ptr) {
      unrefIfNecessary(m_ptr);
      m_ptr = ref.m_ptr;
      refIfNecessary(m_ptr);
    }
    return *this;
  }

  // The STL assumes rvalue references are unique and for simplicity's sake, we
  // make the same assumption here, that &ref != this.
  RefPtr<T>& operator=(RefPtr<T>&& ref) {
    unrefIfNecessary(m_ptr);
    m_ptr = ref.m_ptr;
    ref.m_ptr = nullptr;
    return *this;
  }

  template <typename U>
  RefPtr<T>& operator=(RefPtr<U>&& ref) {
    unrefIfNecessary(m_ptr);
    m_ptr = ref.m_ptr;
    ref.m_ptr = nullptr;
    return *this;
  }

  void reset() {
    unrefIfNecessary(m_ptr);
    m_ptr = nullptr;
  }

  T* get() const {
    return m_ptr;
  }

  T* operator->() const {
    return m_ptr;
  }

  T& operator*() const {
    return *m_ptr;
  }

  template <typename U>
  explicit operator RefPtr<U> () const;

  explicit operator bool() const {
    return m_ptr ? true : false;
  }

  bool isTheLastRef() const {
    FBASSERT(m_ptr);
    return m_ptr->hasOnlyOneRef();
  }

  // Creates a strong reference from a raw pointer, assuming that is already
  // referenced from some other RefPtr. This should be used sparingly.
  static inline RefPtr<T> assumeAlreadyReffed(T* ptr) {
    return RefPtr<T>(ptr, ConstructionMode::External);
  }

  // Creates a strong reference from a raw pointer, assuming that it points to a
  // freshly-created object. See the documentation for RefPtr for usage.
  static inline RefPtr<T> adoptRef(T* ptr) {
    return RefPtr<T>(ptr, ConstructionMode::Adopted);
  }

private:
  enum class ConstructionMode {
    Adopted,
    External
  };

  RefPtr(T* ptr, ConstructionMode mode) :
    m_ptr(ptr)
  {
    FBASSERTMSGF(ptr, "Got null pointer in %s construction mode", mode == ConstructionMode::Adopted ? "adopted" : "external");
    ptr->ref();
    if (mode == ConstructionMode::Adopted) {
      FBASSERT(ptr->hasOnlyOneRef());
    }
  }

  static inline void refIfNecessary(T* ptr) {
    if (ptr) {
      ptr->ref();
    }
  }
  static inline void unrefIfNecessary(T* ptr) {
    if (ptr) {
      ptr->unref();
    }
  }

  template <typename U> friend class RefPtr;

  T* m_ptr;
};

// Creates a strong reference from a raw pointer, assuming that is already
// referenced from some other RefPtr and that it is non-null. This should be
// used sparingly.
template <typename T>
static inline RefPtr<T> assumeAlreadyReffed(T* ptr) {
  return RefPtr<T>::assumeAlreadyReffed(ptr);
}

// As above, but tolerant of nullptr.
template <typename T>
static inline RefPtr<T> assumeAlreadyReffedOrNull(T* ptr) {
  return ptr ? RefPtr<T>::assumeAlreadyReffed(ptr) : nullptr;
}

// Creates a strong reference from a raw pointer, assuming that it points to a
// freshly-created object. See the documentation for RefPtr for usage.
template <typename T>
static inline RefPtr<T> adoptRef(T* ptr) {
  return RefPtr<T>::adoptRef(ptr);
}

template <typename T, typename ...Args>
static inline RefPtr<T> createNew(Args&&... arguments) {
  return RefPtr<T>::adoptRef(new T(std::forward<Args>(arguments)...));
}

template <typename T> template <typename U>
RefPtr<T>::operator RefPtr<U>() const {
  static_assert(std::is_base_of<T, U>::value, "Invalid static cast");
  return assumeAlreadyReffedOrNull<U>(static_cast<U*>(m_ptr));
}

template <typename T, typename U>
inline bool operator==(const RefPtr<T>& a, const RefPtr<U>& b) {
  return a.get() == b.get();
}

template <typename T, typename U>
inline bool operator!=(const RefPtr<T>& a, const RefPtr<U>& b) {
  return a.get() != b.get();
}

template <typename T, typename U>
inline bool operator==(const RefPtr<T>& ref, U* ptr) {
  return ref.get() == ptr;
}

template <typename T, typename U>
inline bool operator!=(const RefPtr<T>& ref, U* ptr) {
  return ref.get() != ptr;
}

template <typename T, typename U>
inline bool operator==(U* ptr, const RefPtr<T>& ref) {
  return ref.get() == ptr;
}

template <typename T, typename U>
inline bool operator!=(U* ptr, const RefPtr<T>& ref) {
  return ref.get() != ptr;
}

template <typename T>
inline bool operator==(const RefPtr<T>& ref, std::nullptr_t ptr) {
  return ref.get() == ptr;
}

template <typename T>
inline bool operator!=(const RefPtr<T>& ref, std::nullptr_t ptr) {
  return ref.get() != ptr;
}

template <typename T>
inline bool operator==(std::nullptr_t ptr, const RefPtr<T>& ref) {
  return ref.get() == ptr;
}

template <typename T>
inline bool operator!=(std::nullptr_t ptr, const RefPtr<T>& ref) {
  return ref.get() != ptr;
}

}
