/*
 * Copyright 2017-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <string>
#include <type_traits>
#include <vector>

namespace {
// This struct is different in every translation unit.  We use template
// instantiations to define inline freestanding methods.  Since the
// methods are inline it is fine to define them in multiple translation
// units, but the instantiation itself would be an ODR violation if it is
// present in the program more than once.  By tagging the instantiations
// with this struct, we avoid ODR problems for the instantiation while
// allowing the resulting methods to be inline-able.  If you think that
// seems hacky keep reading...
struct FollyMemoryDetailTranslationUnitTag {};
} // namespace
namespace folly {
namespace detail {
void unsafeStringSetLargerSize(std::string& s, std::size_t n);
template <typename T>
void unsafeVectorSetLargerSize(std::vector<T>& v, std::size_t n);
} // namespace detail

/*
 * This file provides helper functions resizeWithoutInitialization()
 * that can resize std::string or std::vector without constructing or
 * initializing new elements.
 *
 * IMPORTANT: These functions can be unsafe if used improperly.  If you
 * don't write to an element with index >= oldSize and < newSize, reading
 * the element can expose arbitrary memory contents to the world, including
 * the contents of old strings.  If you're lucky you'll get a segfault,
 * because the kernel is only required to fault in new pages on write
 * access.  MSAN should be able to catch problems in the common case that
 * the string or vector wasn't previously shrunk.
 *
 * Pay extra attention to your failure paths.  For example, if you try
 * to read directly into a caller-provided string, make sure to clear
 * the string when you get an I/O error.
 *
 * You should only use this if you have profiling data from production
 * that shows that this is not a premature optimization.  This code is
 * designed for retroactively optimizing code where touching every element
 * twice (or touching never-used elements once) shows up in profiling,
 * and where restructuring the code to use fixed-length arrays or IOBuf-s
 * would be difficult.
 *
 * NOTE: Just because .resize() shows up in your profile (probably
 * via one of the intrinsic memset implementations) doesn't mean that
 * these functions will make your program faster.  A lot of the cost
 * of memset comes from cache misses, so avoiding the memset can mean
 * that the cache miss cost just gets pushed to the following code.
 * resizeWithoutInitialization can be a win when the contents are bigger
 * than a cache level, because the second access isn't free in that case.
 * It can be a win when the memory is already cached, so touching it
 * doesn't help later code.  It can also be a win if the final length
 * of the string or vector isn't actually known, so the suffix will be
 * chopped off with a second call to .resize().
 */

/**
 * Like calling s.resize(n), but when growing the string does not
 * initialize new elements.  It is undefined behavior to read from
 * any element added to the string by this method unless it has been
 * written to by an operation that follows this call.
 *
 * IMPORTANT: Read the warning at the top of this header file.
 */
inline void resizeWithoutInitialization(std::string& s, std::size_t n) {
  if (n <= s.size()) {
    s.resize(n);
  } else {
    // careful not to call reserve unless necessary, as it causes
    // shrink_to_fit on many platforms
    if (n > s.capacity()) {
      s.reserve(n);
    }
    detail::unsafeStringSetLargerSize(s, n);
  }
}

/**
 * Like calling v.resize(n), but when growing the vector does not construct
 * or initialize new elements.  It is undefined behavior to read from any
 * element added to the vector by this method unless it has been written
 * to by an operation that follows this call.
 *
 * Use the FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT(T) macro to
 * declare (and inline define) the internals required to call
 * resizeWithoutInitialization for a std::vector<T>.  This must
 * be done exactly once in each translation unit that wants to call
 * resizeWithoutInitialization(std::vector<T>&,size_t).  char and unsigned
 * char are provided by default.  If you don't do this you will get linker
 * errors about folly::detail::unsafeVectorSetLargerSize.  Requiring that
 * T be trivially_destructible is only an approximation of the property
 * required of T.  In fact what is required is that any random sequence of
 * bytes may be safely reinterpreted as a T and passed to T's destructor.
 *
 * std::vector<bool> has specialized internals and is not supported.
 *
 * IMPORTANT: Read the warning at the top of this header file.
 */
template <
    typename T,
    typename = typename std::enable_if<
        std::is_trivially_destructible<T>::value &&
        !std::is_same<T, bool>::value>::type>
void resizeWithoutInitialization(std::vector<T>& v, std::size_t n) {
  if (n <= v.size()) {
    v.resize(n);
  } else {
    if (n > v.capacity()) {
      v.reserve(n);
    }
    detail::unsafeVectorSetLargerSize(v, n);
  }
}

namespace detail {

#if defined(_LIBCPP_STRING)
// libc++

} // namespace detail
} // namespace folly
template void std::string::__set_size(std::size_t);
namespace folly {
namespace detail {

template <typename Tag, typename T, typename A, A Ptr__set_size>
struct MakeUnsafeStringSetLargerSize {
  friend void unsafeStringSetLargerSize(
      std::basic_string<T>& s,
      std::size_t n) {
    // s.__set_size(n);
    (s.*Ptr__set_size)(n);
    (&s[0])[n] = '\0';
  }
};
template struct MakeUnsafeStringSetLargerSize<
    FollyMemoryDetailTranslationUnitTag,
    char,
    void (std::string::*)(std::size_t),
    &std::string::__set_size>;

#elif defined(_GLIBCXX_USE_FB)
// FBString

template <typename Tag, typename T, typename A, A Ptrstore_>
struct MakeUnsafeStringSetLargerSize {
  friend void unsafeStringSetLargerSize(
      std::basic_string<T>& s,
      std::size_t n) {
    // s.store_.expandNoinit(n - s.size(), false);
    (s.*Ptrstore_).expandNoinit(n - s.size(), false);
  }
};
template struct MakeUnsafeStringSetLargerSize<
    FollyMemoryDetailTranslationUnitTag,
    char,
    std::fbstring_core<char>(std::string::*),
    &std::string::store_>;

#elif defined(_GLIBCXX_STRING) && _GLIBCXX_USE_CXX11_ABI
// libstdc++ new implementation with SSO

} // namespace detail
} // namespace folly
template void std::string::_M_set_length(std::size_t);
namespace folly {
namespace detail {

template <typename Tag, typename T, typename A, A Ptr_M_set_length>
struct MakeUnsafeStringSetLargerSize {
  friend void unsafeStringSetLargerSize(
      std::basic_string<T>& s,
      std::size_t n) {
    // s._M_set_length(n);
    (s.*Ptr_M_set_length)(n);
  }
};
template struct MakeUnsafeStringSetLargerSize<
    FollyMemoryDetailTranslationUnitTag,
    char,
    void (std::string::*)(std::size_t),
    &std::string::_M_set_length>;

#elif defined(_GLIBCXX_STRING)
// libstdc++ old implementation

} // namespace detail
} // namespace folly
template std::string::_Rep* std::string::_M_rep() const;
template void std::string::_Rep::_M_set_length_and_sharable(std::size_t);
namespace folly {
namespace detail {

template <
    typename Tag,
    typename T,
    typename A,
    A Ptr_M_rep,
    typename B,
    B Ptr_M_set_length_and_sharable>
struct MakeUnsafeStringSetLargerSize {
  friend void unsafeStringSetLargerSize(
      std::basic_string<T>& s,
      std::size_t n) {
    // s._M_rep()->_M_set_length_and_sharable(n);
    auto rep = (s.*Ptr_M_rep)();
    (rep->*Ptr_M_set_length_and_sharable)(n);
  }
};
template struct MakeUnsafeStringSetLargerSize<
    FollyMemoryDetailTranslationUnitTag,
    char,
    std::string::_Rep* (std::string::*)() const,
    &std::string::_M_rep,
    void (std::string::_Rep::*)(std::size_t),
    &std::string::_Rep::_M_set_length_and_sharable>;

#elif defined(_MSC_VER)
// MSVC

inline void unsafeStringSetLargerSize(std::string& s, std::size_t n) {
  s._Eos(n);
}

#else
#warning "No implementation for resizeWithoutInitialization of std::string"
#endif

// This machinery bridges template expansion and macro expansion
#define FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT_IMPL(TYPE)              \
  namespace folly {                                                      \
  namespace detail {                                                     \
  void unsafeVectorSetLargerSizeImpl(std::vector<TYPE>& v, std::size_t); \
  template <>                                                            \
  inline void unsafeVectorSetLargerSize<TYPE>(                           \
      std::vector<TYPE> & v,                                             \
      std::size_t n) {                                                   \
    unsafeVectorSetLargerSizeImpl(v, n);                                 \
  }                                                                      \
  }                                                                      \
  }

#if defined(_LIBCPP_VECTOR)
// libc++

template <typename Tag, typename T, typename A, A Ptr__end_>
struct MakeUnsafeVectorSetLargerSize {
  friend void unsafeVectorSetLargerSizeImpl(std::vector<T>& v, std::size_t n) {
    // v.__end_ += (n - v.size());
    using Base = std::__vector_base<T, std::allocator<T>>;
    static_assert(
        std::is_standard_layout<std::vector<T>>::value &&
            sizeof(std::vector<T>) == sizeof(Base),
        "reinterpret_cast safety conditions not met");
    reinterpret_cast<Base&>(v).*Ptr__end_ += (n - v.size());
  }
};

#define FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT(TYPE)          \
  template struct folly::detail::MakeUnsafeVectorSetLargerSize< \
      FollyMemoryDetailTranslationUnitTag,                      \
      TYPE,                                                     \
      TYPE*(std::__vector_base<TYPE, std::allocator<TYPE>>::*), \
      &std::vector<TYPE>::__end_>;                              \
  FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT_IMPL(TYPE)

#elif defined(_GLIBCXX_VECTOR)
// libstdc++

template <
    typename Tag,
    typename T,
    typename A,
    A Ptr_M_impl,
    typename B,
    B Ptr_M_finish>
struct MakeUnsafeVectorSetLargerSize : std::vector<T> {
  friend void unsafeVectorSetLargerSizeImpl(std::vector<T>& v, std::size_t n) {
    // v._M_impl._M_finish += (n - v.size());
    (v.*Ptr_M_impl).*Ptr_M_finish += (n - v.size());
  }
};

#define FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT(TYPE)          \
  template struct folly::detail::MakeUnsafeVectorSetLargerSize< \
      FollyMemoryDetailTranslationUnitTag,                      \
      TYPE,                                                     \
      std::vector<TYPE>::_Vector_impl(                          \
          std::_Vector_base<TYPE, std::allocator<TYPE>>::*),    \
      &std::vector<TYPE>::_M_impl,                              \
      TYPE*(std::vector<TYPE>::_Vector_impl::*),                \
      &std::vector<TYPE>::_Vector_impl::_M_finish>;             \
  FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT_IMPL(TYPE)

#elif defined(_MSC_VER)
// MSVC

#define FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT(TYPE) \
  extern inline void unsafeVectorSetLargerSizeImpl(    \
      std::vector<TYPE>& v, std::size_t n) {           \
    v._Mylast() += (n - v.size());                     \
  }                                                    \
  FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT_IMPL(TYPE)

#else
#warning "No implementation for resizeWithoutInitialization of std::vector"
#endif

} // namespace detail
} // namespace folly

#if defined(FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT)
FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT(char)
FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT(unsigned char)
#endif
