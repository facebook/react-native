/*
 * Copyright 2013-present Facebook, Inc.
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

#include <cassert>
#include <cerrno>
#include <cstddef>
#include <cstdlib>
#include <exception>
#include <limits>
#include <memory>
#include <stdexcept>
#include <type_traits>
#include <utility>

#include <folly/ConstexprMath.h>
#include <folly/Likely.h>
#include <folly/Traits.h>
#include <folly/functional/Invoke.h>
#include <folly/lang/Align.h>
#include <folly/lang/Exception.h>
#include <folly/portability/Config.h>
#include <folly/portability/Malloc.h>

namespace folly {

#if _POSIX_C_SOURCE >= 200112L || _XOPEN_SOURCE >= 600 || \
    (defined(__ANDROID__) && (__ANDROID_API__ > 16)) ||   \
    (defined(__APPLE__) &&                                \
     (__MAC_OS_X_VERSION_MIN_REQUIRED >= __MAC_10_6 ||    \
      __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_3_0))

inline void* aligned_malloc(size_t size, size_t align) {
  // use posix_memalign, but mimic the behaviour of memalign
  void* ptr = nullptr;
  int rc = posix_memalign(&ptr, align, size);
  return rc == 0 ? (errno = 0, ptr) : (errno = rc, nullptr);
}

inline void aligned_free(void* aligned_ptr) {
  free(aligned_ptr);
}

#elif defined(_WIN32)

inline void* aligned_malloc(size_t size, size_t align) {
  return _aligned_malloc(size, align);
}

inline void aligned_free(void* aligned_ptr) {
  _aligned_free(aligned_ptr);
}

#else

inline void* aligned_malloc(size_t size, size_t align) {
  return memalign(align, size);
}

inline void aligned_free(void* aligned_ptr) {
  free(aligned_ptr);
}

#endif

namespace detail {
template <typename Alloc, size_t kAlign, bool kAllocate>
void rawOverAlignedImpl(Alloc const& alloc, size_t n, void*& raw) {
  static_assert((kAlign & (kAlign - 1)) == 0, "Align must be a power of 2");

  using AllocTraits = std::allocator_traits<Alloc>;
  using T = typename AllocTraits::value_type;

  constexpr bool kCanBypass = std::is_same<Alloc, std::allocator<T>>::value;

  // BaseType is a type that gives us as much alignment as we need if
  // we can get it naturally, otherwise it is aligned as max_align_t.
  // kBaseAlign is both the alignment and size of this type.
  constexpr size_t kBaseAlign = constexpr_min(kAlign, alignof(max_align_t));
  using BaseType = std::aligned_storage_t<kBaseAlign, kBaseAlign>;
  using BaseAllocTraits =
      typename AllocTraits::template rebind_traits<BaseType>;
  using BaseAlloc = typename BaseAllocTraits::allocator_type;
  static_assert(
      sizeof(BaseType) == kBaseAlign && alignof(BaseType) == kBaseAlign, "");

#if __cpp_sized_deallocation
  if (kCanBypass && kAlign == kBaseAlign) {
    // until std::allocator uses sized deallocation, it is worth the
    // effort to bypass it when we are able
    if (kAllocate) {
      raw = ::operator new(n * sizeof(T));
    } else {
      ::operator delete(raw, n * sizeof(T));
    }
    return;
  }
#endif

  if (kCanBypass && kAlign > kBaseAlign) {
    // allocating as BaseType isn't sufficient to get alignment, but
    // since we can bypass Alloc we can use something like posix_memalign
    if (kAllocate) {
      raw = aligned_malloc(n * sizeof(T), kAlign);
    } else {
      aligned_free(raw);
    }
    return;
  }

  // we're not allowed to bypass Alloc, or we don't want to
  BaseAlloc a(alloc);

  // allocation size is counted in sizeof(BaseType)
  size_t quanta = (n * sizeof(T) + kBaseAlign - 1) / sizeof(BaseType);
  if (kAlign <= kBaseAlign) {
    // rebinding Alloc to BaseType is sufficient to get us the alignment
    // we want, happy path
    if (kAllocate) {
      raw = static_cast<void*>(
          std::addressof(*BaseAllocTraits::allocate(a, quanta)));
    } else {
      BaseAllocTraits::deallocate(
          a,
          std::pointer_traits<typename BaseAllocTraits::pointer>::pointer_to(
              *static_cast<BaseType*>(raw)),
          quanta);
    }
    return;
  }

  // Overaligned and custom allocator, our only option is to
  // overallocate and store a delta to the actual allocation just
  // before the returned ptr.
  //
  // If we give ourselves kAlign extra bytes, then since
  // sizeof(BaseType) divides kAlign we can meet alignment while
  // getting a prefix of one BaseType.  If we happen to get a
  // kAlign-aligned block, then we can return a pointer to underlying
  // + kAlign, otherwise there will be at least kBaseAlign bytes in
  // the unused prefix of the first kAlign-aligned block.
  if (kAllocate) {
    char* base = reinterpret_cast<char*>(std::addressof(
        *BaseAllocTraits::allocate(a, quanta + kAlign / sizeof(BaseType))));
    size_t byteDelta =
        kAlign - (reinterpret_cast<uintptr_t>(base) & (kAlign - 1));
    raw = static_cast<void*>(base + byteDelta);
    static_cast<size_t*>(raw)[-1] = byteDelta;
  } else {
    size_t byteDelta = static_cast<size_t*>(raw)[-1];
    char* base = static_cast<char*>(raw) - byteDelta;
    BaseAllocTraits::deallocate(
        a,
        std::pointer_traits<typename BaseAllocTraits::pointer>::pointer_to(
            *reinterpret_cast<BaseType*>(base)),
        quanta + kAlign / sizeof(BaseType));
  }
}
} // namespace detail

// Works like std::allocator_traits<Alloc>::allocate, but handles
// over-aligned types.  Feel free to manually specify any power of two as
// the Align template arg.  Must be matched with deallocateOverAligned.
// allocationBytesForOverAligned will give you the number of bytes that
// this function actually requests.
template <
    typename Alloc,
    size_t kAlign = alignof(typename std::allocator_traits<Alloc>::value_type)>
typename std::allocator_traits<Alloc>::pointer allocateOverAligned(
    Alloc const& alloc,
    size_t n) {
  void* raw = nullptr;
  detail::rawOverAlignedImpl<Alloc, kAlign, true>(alloc, n, raw);
  return std::pointer_traits<typename std::allocator_traits<Alloc>::pointer>::
      pointer_to(
          *static_cast<typename std::allocator_traits<Alloc>::value_type*>(
              raw));
}

template <
    typename Alloc,
    size_t kAlign = alignof(typename std::allocator_traits<Alloc>::value_type)>
void deallocateOverAligned(
    Alloc const& alloc,
    typename std::allocator_traits<Alloc>::pointer ptr,
    size_t n) {
  void* raw = static_cast<void*>(std::addressof(*ptr));
  detail::rawOverAlignedImpl<Alloc, kAlign, false>(alloc, n, raw);
}

template <
    typename Alloc,
    size_t kAlign = alignof(typename std::allocator_traits<Alloc>::value_type)>
size_t allocationBytesForOverAligned(size_t n) {
  static_assert((kAlign & (kAlign - 1)) == 0, "Align must be a power of 2");

  using AllocTraits = std::allocator_traits<Alloc>;
  using T = typename AllocTraits::value_type;

  constexpr size_t kBaseAlign = constexpr_min(kAlign, alignof(max_align_t));

  if (kAlign > kBaseAlign && std::is_same<Alloc, std::allocator<T>>::value) {
    return n * sizeof(T);
  } else {
    size_t quanta = (n * sizeof(T) + kBaseAlign - 1) / kBaseAlign;
    if (kAlign > kBaseAlign) {
      quanta += kAlign / kBaseAlign;
    }
    return quanta * kBaseAlign;
  }
}

/**
 * For exception safety and consistency with make_shared. Erase me when
 * we have std::make_unique().
 *
 * @author Louis Brandy (ldbrandy@fb.com)
 * @author Xu Ning (xning@fb.com)
 */

#if __cplusplus >= 201402L || __cpp_lib_make_unique >= 201304L || \
    (__ANDROID__ && __cplusplus >= 201300L) || _MSC_VER >= 1900

/* using override */ using std::make_unique;

#else

template <typename T, typename... Args>
typename std::enable_if<!std::is_array<T>::value, std::unique_ptr<T>>::type
make_unique(Args&&... args) {
  return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

// Allows 'make_unique<T[]>(10)'. (N3690 s20.9.1.4 p3-4)
template <typename T>
typename std::enable_if<std::is_array<T>::value, std::unique_ptr<T>>::type
make_unique(const size_t n) {
  return std::unique_ptr<T>(new typename std::remove_extent<T>::type[n]());
}

// Disallows 'make_unique<T[10]>()'. (N3690 s20.9.1.4 p5)
template <typename T, typename... Args>
typename std::enable_if<std::extent<T>::value != 0, std::unique_ptr<T>>::type
make_unique(Args&&...) = delete;

#endif

/**
 * static_function_deleter
 *
 * So you can write this:
 *
 *      using RSA_deleter = folly::static_function_deleter<RSA, &RSA_free>;
 *      auto rsa = std::unique_ptr<RSA, RSA_deleter>(RSA_new());
 *      RSA_generate_key_ex(rsa.get(), bits, exponent, nullptr);
 *      rsa = nullptr;  // calls RSA_free(rsa.get())
 *
 * This would be sweet as well for BIO, but unfortunately BIO_free has signature
 * int(BIO*) while we require signature void(BIO*). So you would need to make a
 * wrapper for it:
 *
 *      inline void BIO_free_fb(BIO* bio) { CHECK_EQ(1, BIO_free(bio)); }
 *      using BIO_deleter = folly::static_function_deleter<BIO, &BIO_free_fb>;
 *      auto buf = std::unique_ptr<BIO, BIO_deleter>(BIO_new(BIO_s_mem()));
 *      buf = nullptr;  // calls BIO_free(buf.get())
 */

template <typename T, void (*f)(T*)>
struct static_function_deleter {
  void operator()(T* t) const {
    f(t);
  }
};

/**
 *  to_shared_ptr
 *
 *  Convert unique_ptr to shared_ptr without specifying the template type
 *  parameter and letting the compiler deduce it.
 *
 *  So you can write this:
 *
 *      auto sptr = to_shared_ptr(getSomethingUnique<T>());
 *
 *  Instead of this:
 *
 *      auto sptr = shared_ptr<T>(getSomethingUnique<T>());
 *
 *  Useful when `T` is long, such as:
 *
 *      using T = foobar::FooBarAsyncClient;
 */
template <typename T, typename D>
std::shared_ptr<T> to_shared_ptr(std::unique_ptr<T, D>&& ptr) {
  return std::shared_ptr<T>(std::move(ptr));
}

/**
 *  to_weak_ptr
 *
 *  Make a weak_ptr and return it from a shared_ptr without specifying the
 *  template type parameter and letting the compiler deduce it.
 *
 *  So you can write this:
 *
 *      auto wptr = to_weak_ptr(getSomethingShared<T>());
 *
 *  Instead of this:
 *
 *      auto wptr = weak_ptr<T>(getSomethingShared<T>());
 *
 *  Useful when `T` is long, such as:
 *
 *      using T = foobar::FooBarAsyncClient;
 */
template <typename T>
std::weak_ptr<T> to_weak_ptr(const std::shared_ptr<T>& ptr) {
  return std::weak_ptr<T>(ptr);
}

namespace detail {
template <typename T>
struct lift_void_to_char {
  using type = T;
};
template <>
struct lift_void_to_char<void> {
  using type = char;
};
} // namespace detail

/**
 * SysAllocator
 *
 * Resembles std::allocator, the default Allocator, but wraps std::malloc and
 * std::free.
 */
template <typename T>
class SysAllocator {
 private:
  using Self = SysAllocator<T>;

 public:
  using value_type = T;

  T* allocate(size_t count) {
    using lifted = typename detail::lift_void_to_char<T>::type;
    auto const p = std::malloc(sizeof(lifted) * count);
    if (!p) {
      throw_exception<std::bad_alloc>();
    }
    return static_cast<T*>(p);
  }
  void deallocate(T* p, size_t /* count */) {
    std::free(p);
  }

  friend bool operator==(Self const&, Self const&) noexcept {
    return true;
  }
  friend bool operator!=(Self const&, Self const&) noexcept {
    return false;
  }
};

class DefaultAlign {
 private:
  using Self = DefaultAlign;
  std::size_t align_;

 public:
  explicit DefaultAlign(std::size_t align) noexcept : align_(align) {
    assert(!(align_ < sizeof(void*)) && bool("bad align: too small"));
    assert(!(align_ & (align_ - 1)) && bool("bad align: not power-of-two"));
  }
  std::size_t operator()() const noexcept {
    return align_;
  }

  friend bool operator==(Self const& a, Self const& b) noexcept {
    return a.align_ == b.align_;
  }
  friend bool operator!=(Self const& a, Self const& b) noexcept {
    return a.align_ != b.align_;
  }
};

template <std::size_t Align>
class FixedAlign {
 private:
  static_assert(!(Align < sizeof(void*)), "bad align: too small");
  static_assert(!(Align & (Align - 1)), "bad align: not power-of-two");
  using Self = FixedAlign<Align>;

 public:
  constexpr std::size_t operator()() const noexcept {
    return Align;
  }

  friend bool operator==(Self const&, Self const&) noexcept {
    return true;
  }
  friend bool operator!=(Self const&, Self const&) noexcept {
    return false;
  }
};

/**
 * AlignedSysAllocator
 *
 * Resembles std::allocator, the default Allocator, but wraps aligned_malloc and
 * aligned_free.
 *
 * Accepts a policy parameter for providing the alignment, which must:
 *   * be invocable as std::size_t() noexcept, returning the alignment
 *   * be noexcept-copy-constructible
 *   * have noexcept operator==
 *   * have noexcept operator!=
 *   * not be final
 *
 * DefaultAlign and FixedAlign<std::size_t>, provided above, are valid policies.
 */
template <typename T, typename Align = DefaultAlign>
class AlignedSysAllocator : private Align {
 private:
  using Self = AlignedSysAllocator<T, Align>;

  template <typename, typename>
  friend class AlignedSysAllocator;

  constexpr Align const& align() const {
    return *this;
  }

 public:
  static_assert(std::is_nothrow_copy_constructible<Align>::value, "");
  static_assert(is_nothrow_invocable_r<std::size_t, Align>::value, "");

  using value_type = T;

  using propagate_on_container_copy_assignment = std::true_type;
  using propagate_on_container_move_assignment = std::true_type;
  using propagate_on_container_swap = std::true_type;

  using Align::Align;

  // TODO: remove this ctor, which is required only by gcc49
  template <
      typename S = Align,
      _t<std::enable_if<std::is_default_constructible<S>::value, int>> = 0>
  constexpr AlignedSysAllocator() noexcept(noexcept(Align())) : Align() {}

  template <typename U>
  constexpr explicit AlignedSysAllocator(
      AlignedSysAllocator<U, Align> const& other) noexcept
      : Align(other.align()) {}

  T* allocate(size_t count) {
    using lifted = typename detail::lift_void_to_char<T>::type;
    auto const p = aligned_malloc(sizeof(lifted) * count, align()());
    if (!p) {
      if (FOLLY_UNLIKELY(errno != ENOMEM)) {
        std::terminate();
      }
      throw_exception<std::bad_alloc>();
    }
    return static_cast<T*>(p);
  }
  void deallocate(T* p, size_t /* count */) {
    aligned_free(p);
  }

  friend bool operator==(Self const& a, Self const& b) noexcept {
    return a.align() == b.align();
  }
  friend bool operator!=(Self const& a, Self const& b) noexcept {
    return a.align() != b.align();
  }
};

/**
 * CxxAllocatorAdaptor
 *
 * A type conforming to C++ concept Allocator, delegating operations to an
 * unowned Inner which has this required interface:
 *
 *   void* allocate(std::size_t)
 *   void deallocate(void*, std::size_t)
 *
 * Note that Inner is *not* a C++ Allocator.
 */
template <typename T, class Inner>
class CxxAllocatorAdaptor {
 private:
  using Self = CxxAllocatorAdaptor<T, Inner>;

  template <typename U, typename UAlloc>
  friend class CxxAllocatorAdaptor;

  std::reference_wrapper<Inner> ref_;

 public:
  using value_type = T;

  using propagate_on_container_copy_assignment = std::true_type;
  using propagate_on_container_move_assignment = std::true_type;
  using propagate_on_container_swap = std::true_type;

  explicit CxxAllocatorAdaptor(Inner& ref) : ref_(ref) {}

  template <typename U>
  explicit CxxAllocatorAdaptor(CxxAllocatorAdaptor<U, Inner> const& other)
      : ref_(other.ref_) {}

  T* allocate(std::size_t n) {
    using lifted = typename detail::lift_void_to_char<T>::type;
    return static_cast<T*>(ref_.get().allocate(sizeof(lifted) * n));
  }
  void deallocate(T* p, std::size_t n) {
    using lifted = typename detail::lift_void_to_char<T>::type;
    ref_.get().deallocate(p, sizeof(lifted) * n);
  }

  friend bool operator==(Self const& a, Self const& b) noexcept {
    return std::addressof(a.ref_.get()) == std::addressof(b.ref_.get());
  }
  friend bool operator!=(Self const& a, Self const& b) noexcept {
    return std::addressof(a.ref_.get()) != std::addressof(b.ref_.get());
  }
};

/*
 * allocator_delete
 *
 * A deleter which automatically works with a given allocator.
 *
 * Derives from the allocator to take advantage of the empty base
 * optimization when possible.
 */
template <typename Alloc>
class allocator_delete : private std::remove_reference<Alloc>::type {
 private:
  using allocator_type = typename std::remove_reference<Alloc>::type;
  using allocator_traits = std::allocator_traits<allocator_type>;
  using value_type = typename allocator_traits::value_type;
  using pointer = typename allocator_traits::pointer;

 public:
  allocator_delete() = default;
  allocator_delete(allocator_delete const&) = default;
  allocator_delete(allocator_delete&&) = default;
  allocator_delete& operator=(allocator_delete const&) = default;
  allocator_delete& operator=(allocator_delete&&) = default;

  explicit allocator_delete(const allocator_type& alloc)
      : allocator_type(alloc) {}

  explicit allocator_delete(allocator_type&& alloc)
      : allocator_type(std::move(alloc)) {}

  template <typename U>
  allocator_delete(const allocator_delete<U>& other)
      : allocator_type(other.get_allocator()) {}

  allocator_type const& get_allocator() const {
    return *this;
  }

  void operator()(pointer p) const {
    auto alloc = get_allocator();
    allocator_traits::destroy(alloc, p);
    allocator_traits::deallocate(alloc, p, 1);
  }
};

/**
 * allocate_unique, like std::allocate_shared but for std::unique_ptr
 */
template <typename T, typename Alloc, typename... Args>
std::unique_ptr<T, allocator_delete<Alloc>> allocate_unique(
    Alloc const& alloc,
    Args&&... args) {
  using traits = std::allocator_traits<Alloc>;
  struct DeferCondDeallocate {
    bool& cond;
    Alloc& copy;
    T* p;
    ~DeferCondDeallocate() {
      if (FOLLY_UNLIKELY(!cond)) {
        traits::deallocate(copy, p, 1);
      }
    }
  };
  auto copy = alloc;
  auto const p = traits::allocate(copy, 1);
  {
    bool constructed = false;
    DeferCondDeallocate handler{constructed, copy, p};
    traits::construct(copy, p, static_cast<Args&&>(args)...);
    constructed = true;
  }
  return {p, allocator_delete<Alloc>(std::move(copy))};
}

struct SysBufferDeleter {
  void operator()(void* ptr) {
    std::free(ptr);
  }
};
using SysBufferUniquePtr = std::unique_ptr<void, SysBufferDeleter>;

inline SysBufferUniquePtr allocate_sys_buffer(std::size_t size) {
  auto p = std::malloc(size);
  if (!p) {
    throw_exception<std::bad_alloc>();
  }
  return {p, {}};
}

/**
 * AllocatorHasTrivialDeallocate
 *
 * Unambiguously inherits std::integral_constant<bool, V> for some bool V.
 *
 * Describes whether a C++ Aallocator has trivial, i.e. no-op, deallocate().
 *
 * Also may be used to describe types which may be used with
 * CxxAllocatorAdaptor.
 */
template <typename Alloc>
struct AllocatorHasTrivialDeallocate : std::false_type {};

template <typename T, class Alloc>
struct AllocatorHasTrivialDeallocate<CxxAllocatorAdaptor<T, Alloc>>
    : AllocatorHasTrivialDeallocate<Alloc> {};

namespace detail {
// note that construct and destroy here are methods, not short names for
// the constructor and destructor
FOLLY_CREATE_MEMBER_INVOKE_TRAITS(AllocatorConstruct_, construct);
FOLLY_CREATE_MEMBER_INVOKE_TRAITS(AllocatorDestroy_, destroy);

template <typename Void, typename Alloc, typename... Args>
struct AllocatorCustomizesConstruct_
    : AllocatorConstruct_::template is_invocable<Alloc, Args...> {};

template <typename Alloc, typename... Args>
struct AllocatorCustomizesConstruct_<
    void_t<typename Alloc::folly_has_default_object_construct>,
    Alloc,
    Args...> : Negation<typename Alloc::folly_has_default_object_construct> {};

template <typename Void, typename Alloc, typename... Args>
struct AllocatorCustomizesDestroy_
    : AllocatorDestroy_::template is_invocable<Alloc, Args...> {};

template <typename Alloc, typename... Args>
struct AllocatorCustomizesDestroy_<
    void_t<typename Alloc::folly_has_default_object_destroy>,
    Alloc,
    Args...> : Negation<typename Alloc::folly_has_default_object_destroy> {};
} // namespace detail

/**
 * AllocatorHasDefaultObjectConstruct
 *
 * AllocatorHasDefaultObjectConstruct<A, T, Args...> unambiguously
 * inherits std::integral_constant<bool, V>, where V will be true iff
 * the effect of std::allocator_traits<A>::construct(a, p, args...) is
 * the same as new (static_cast<void*>(p)) T(args...).  If true then
 * any optimizations applicable to object construction (relying on
 * std::is_trivially_copyable<T>, for example) can be applied to objects
 * in an allocator-aware container using an allocation of type A.
 *
 * Allocator types can override V by declaring a type alias for
 * folly_has_default_object_construct.  It is helpful to do this if you
 * define a custom allocator type that defines a construct method, but
 * that method doesn't do anything except call placement new.
 */
template <typename Alloc, typename T, typename... Args>
struct AllocatorHasDefaultObjectConstruct
    : Negation<
          detail::AllocatorCustomizesConstruct_<void, Alloc, T*, Args...>> {};

template <typename Value, typename T, typename... Args>
struct AllocatorHasDefaultObjectConstruct<std::allocator<Value>, T, Args...>
    : std::true_type {};

/**
 * AllocatorHasDefaultObjectDestroy
 *
 * AllocatorHasDefaultObjectDestroy<A, T> unambiguously inherits
 * std::integral_constant<bool, V>, where V will be true iff the effect
 * of std::allocator_traits<A>::destroy(a, p) is the same as p->~T().
 * If true then optimizations applicable to object destruction (relying
 * on std::is_trivially_destructible<T>, for example) can be applied to
 * objects in an allocator-aware container using an allocator of type A.
 *
 * Allocator types can override V by declaring a type alias for
 * folly_has_default_object_destroy.  It is helpful to do this if you
 * define a custom allocator type that defines a destroy method, but that
 * method doesn't do anything except call the object's destructor.
 */
template <typename Alloc, typename T>
struct AllocatorHasDefaultObjectDestroy
    : Negation<detail::AllocatorCustomizesDestroy_<void, Alloc, T*>> {};

template <typename Value, typename T>
struct AllocatorHasDefaultObjectDestroy<std::allocator<Value>, T>
    : std::true_type {};

} // namespace folly
