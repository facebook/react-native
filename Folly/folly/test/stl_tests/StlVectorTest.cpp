/*
 * Copyright 2012-present Facebook, Inc.
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

// @author Nicholas Ormrod <njormrod@fb.com>

/*

This file contains an extensive STL compliance test suite for an STL vector
implementation (such as FBVector).

GCC 4.7 is required.

*/

#if 0
#define USING_STD_VECTOR
#endif

/*

The insanity of this file deserves a superficial explanation.

This file tests an implementation of STL vector. It is extremely comprehensive.
If it compiles (more on that later) it generates a binary which, when run,
exhaustively tests its vector for standard compliance.

Limitations:
-If it doesn't compile, the compiler errors are mind-boggling.
-Not everything is testable. There are a few comments in the code where
 the implementation must be inspected, as opposed to tested. These are very
 simple inspections. Search for 'whitebox'.
-It does not test boolean specialization.

==========================
How this file is organized

--------------
Data and Alloc

Data is a class designed to provide diagnostics when stored in a vector. It
counts the number of operations performed on it, can have any function
disabled or labeled as noexcept, throws errors from anywhere that is not
noexcept, tracks its supposed location in memory (optional), tracks
aggregate information, and can print a trace of its action.

Alloc, like Data, is a full-blown diagnostic allocator. It keeps track of
all space it has allocated, keeps counters, throws exceptions, and can easily
compare equal or not equal with other Allocs.

These two classes have a few useful helper functions:
isSane - checks that all the tracked variables make sense
softReset - simplifies the variables before a test
hardReset - brutally resets all variables to the default state

--------
STL_TEST

Google test is not quite good enough for this test file, because we need to
run tests across different input values and different types.

The STL_TEST macro takes a few arguments:
string - what is being tested
id - unique id, passed to TEST
restriction - requirements for test types
parameters - which variables to range over

Eg: STL_TEST("23.2.3", isCopyable, is_copy_constructible, a) { ... }

The restriction is used to select which types get tested. Copy construction,
for example, requires a data type which is copy constructible, whereas to test
the clear operation, the data only needs to be destructible. If the type does
not pass the restriction, then the test is not instantiated with that type (if
it were, then there would be a compiler error).

The variable names in the standard have very specific meaning. For example,
a and b are always vectors, i and j are always external iterators, etc. These
bindings are used in the STL_TEST - if you need a vector and an int, have
parameters a and n.

There is a list (BOOST_PP_SEQ) of test types and interface types. If the
type passes the restriction, then the test body is instantiated with that
type as its template parameter. Instantiation ensures that the contractual
elements of the standard are satisfied.  Only the test types, however, and
not the interfact types, are actually tested.

If a test type passes the restriction, then it is run with a variety of
arguments. Each variable (e.g. a and b) have a generator, which generates
a range of values for that variable before each test. Generated values are not
reused - they are remade for every run. This causes long runtimes, but ensures
that corner cases are not missed.

There are two implicit extra parameters, z and ticks. Ignore z. Ticks, on the
other hand, is very important. Each is test is run multiple times with the
same arguments; the first time with no ticks (and hence no Data or Alloc
exceptions), and then once again for each and every location that an
exception can be thrown. This ensures that exception corner cases are alse
thoroughly tested.

At the end of each test, a set of verification functions is run to ensure
that nothing was corrupted.

---------
The tests

All specifications from N3337 Chapter 23 (Containers) that pertains to
vector is tested (if possible). Each aspect has a dedicated STL_TEST, so that
there are no compounding errors. The tests are organized as they appear in
N3337.

The backbone of the testing framework is based on a small set of vector
operations:
-empty construction
-copy construction (a little bit)
-size
-capacity
-data
-emplace_back

These functions are used to generate and verify the tests. If they fail, then
the cascade of errors will be enormous. They are, therefore, tested first.

*/
/*

THOUGHTS:

-Not all complexity checks are verified. These will be relentlessly hunted down
 in the benchmarking phase.

-It seems that initializer lists with implicit arguments are constructed before
 being passed into the vector. When one of the constructors fails, it fails in
 the initializer list, before it even gets to the vector. The IL, however,
 doesn't clean up properly, and already-constructed elements are not
 destroyed. This causes a memory leak, and the tests break, but it is not the
 fault of the vector itself. Further, since the implementation for the
 initializer lists is specified in the standard as calling an associated
 function with (il.begin(), il.end()), we really just have to check the throws
 cases for the associated functions (which all work fine). Initializer lists
 also do not work with explicit constructors.

-The implementation of std::copy from iterators prevents Data(int) from being
 explicit. Explicitness is, perhaps, a desirable quality, but with fundamental
 std library code like copy not supporting it, it seems impractical.

*/

// include the vector first, to ensure its header is self-sufficient
#ifdef USING_STD_VECTOR
#include <vector>
#define VECTOR_ std::vector
#else
#include <folly/FBVector.h>
#define VECTOR_ folly::fbvector
#endif

//#define USING_STD_VECTOR

#include <climits>
#include <cstddef>
#include <exception>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <typeinfo>

#include <boost/iterator/iterator_adaptor.hpp>
#include <boost/preprocessor.hpp>

#include <folly/Conv.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

// We use some pre-processor magic to auto-generate setup and destruct code,
// but it also means we have some parameters that may not be used.
FOLLY_PUSH_WARNING
FOLLY_GNU_DISABLE_WARNING("-Wunused-parameter")
FOLLY_GNU_DISABLE_WARNING("-Wunused-variable")
// Using SCOPED_TRACE repeatedly from within a macro violates -Wshadow
FOLLY_GNU_DISABLE_WARNING("-Wshadow")

using namespace std;
using namespace folly;

//=============================================================================
//=============================================================================
// Data type

//-----------------------------------------------------------------------------
// Flags

typedef uint32_t Flags;

// each method has 3 options: normal, noexcept, throw, and deleted
// normal is the default
// throw is mutually exclusive with noexcept
//
// DC - default constructor
// CC - copy constructor
// MC - move constructor
// OC - other constructor
// CA - copy assignment
// MA - move assignment
enum FlagVals : Flags {
  DC_NOEXCEPT = 0x1,
  DC_THROW = 0x2,
  DC_DELETE = 0x8000,
  CC_NOEXCEPT = 0x4,
  CC_THROW = 0x8,
  CC_DELETE = 0x10000,
  MC_NOEXCEPT = 0x10,
  MC_THROW = 0x20,
  MC_DELETE = 0x20000,
  OC_NOEXCEPT = 0x40,
  OC_THROW = 0x80,
  // OC_DELETE - DNE

  CA_NOEXCEPT = 0x100,
  CA_THROW = 0x200,
  CA_DELETE = 0x40000,
  MA_NOEXCEPT = 0x400,
  MA_THROW = 0x800,
  MA_DELETE = 0x80000,

  ALL_DELETE = DC_DELETE | CC_DELETE | MC_DELETE | CA_DELETE | MA_DELETE,

  IS_RELOCATABLE = 0x2000,

  // for the allocator
  PROP_COPY = 0x100000,
  PROP_MOVE = 0x200000,
  PROP_SWAP = 0x400000,
};

//-----------------------------------------------------------------------------
// Deletors

template <bool b>
struct D0 {
  D0() = default;
  D0(const D0&) = default;
  D0(D0&&) = default;
  explicit D0(std::nullptr_t) {}
  D0& operator=(const D0&) = default;
  D0& operator=(D0&&) = default;
};
template <>
struct D0<true> {
  D0() = delete;
  D0(const D0&) = default;
  D0(D0&&) = default;
  explicit D0(std::nullptr_t) {}
  D0& operator=(const D0&) = default;
  D0& operator=(D0&&) = default;
};

template <bool b>
struct D1 {
  D1() = default;
  D1(const D1&) = default;
  D1(D1&&) = default;
  explicit D1(std::nullptr_t) {}
  D1& operator=(const D1&) = default;
  D1& operator=(D1&&) = default;
};
template <>
struct D1<true> {
  D1() = default;
  D1(const D1&) = delete;
  D1(D1&&) = default;
  explicit D1(std::nullptr_t) {}
  D1& operator=(const D1&) = default;
  D1& operator=(D1&&) = default;
};

template <bool b>
struct D2 {
  D2() = default;
  D2(const D2&) = default;
  D2(D2&&) = default;
  explicit D2(std::nullptr_t) {}
  D2& operator=(const D2&) = default;
  D2& operator=(D2&&) = default;
};
template <>
struct D2<true> {
  D2() = default;
  D2(const D2&) = default;
  D2(D2&&) = delete;
  explicit D2(std::nullptr_t) {}
  D2& operator=(const D2&) = default;
  D2& operator=(D2&&) = default;
};

template <bool b>
struct D3 {
  D3() = default;
  D3(const D3&) = default;
  D3(D3&&) = default;
  explicit D3(std::nullptr_t) {}
  D3& operator=(const D3&) = default;
  D3& operator=(D3&&) = default;
};
template <>
struct D3<true> {
  D3() = default;
  D3(const D3&) = default;
  D3(D3&&) = default;
  explicit D3(std::nullptr_t) {}
  D3& operator=(const D3&) = delete;
  D3& operator=(D3&&) = default;
};

template <bool b>
struct D4 {
  D4() = default;
  D4(const D4&) = default;
  D4(D4&&) = default;
  explicit D4(std::nullptr_t) {}
  D4& operator=(const D4&) = default;
  D4& operator=(D4&&) = default;
};
template <>
struct D4<true> {
  D4() = default;
  D4(const D4&) = default;
  D4(D4&&) = default;
  explicit D4(std::nullptr_t) {}
  D4& operator=(const D4&) = default;
  D4& operator=(D4&&) = delete;
};

template <Flags f>
struct Delete : D0<(f & DC_DELETE) != 0>,
                D1<(f & CC_DELETE) != 0>,
                D2<(f & MC_DELETE) != 0>,
                D3<(f & CA_DELETE) != 0>,
                D4<(f & MA_DELETE) != 0> {
  Delete() = default;
  Delete(const Delete&) = default;
  Delete(Delete&&) = default;
  Delete& operator=(const Delete&) = default;
  Delete& operator=(Delete&&) = default;

  explicit Delete(std::nullptr_t)
      : D0<(f & DC_DELETE) != 0>(nullptr),
        D1<(f & CC_DELETE) != 0>(nullptr),
        D2<(f & MC_DELETE) != 0>(nullptr),
        D3<(f & CA_DELETE) != 0>(nullptr),
        D4<(f & MA_DELETE) != 0>(nullptr) {}
};

//-----------------------------------------------------------------------------
// Ticker

struct TickException : std::runtime_error {
  explicit TickException(const std::string& s)
      : std::runtime_error("tick: " + s) {}
};

struct Ticker {
  static int CountTicks;
  static int TicksLeft;
  static void Tick(const std::string& s) {
    if (TicksLeft == 0) {
      throw TickException(s);
    }
    CountTicks++;
    TicksLeft--;
  }
};

int Ticker::CountTicks = 0;
int Ticker::TicksLeft = -1;

template <Flags f>
struct DataTicker : Ticker {
  DataTicker() noexcept(f& DC_NOEXCEPT) {
    if (!(f & DC_NOEXCEPT)) {
      Tick("Data()");
    }
  }
  DataTicker(const DataTicker&) noexcept((f & CC_NOEXCEPT) != 0) {
    if (!(f & CC_NOEXCEPT)) {
      Tick("Data(const Data&)");
    }
  }
  DataTicker(DataTicker&&) noexcept((f & MC_NOEXCEPT) != 0) {
    if (!(f & MC_NOEXCEPT)) {
      Tick("Data(Data&&)");
    }
  }
  explicit DataTicker(std::nullptr_t) noexcept((f & OC_NOEXCEPT) != 0) {
    if (!(f & OC_NOEXCEPT)) {
      Tick("Data(int)");
    }
  }
  ~DataTicker() noexcept {}
  void operator=(const DataTicker&) noexcept((f & CA_NOEXCEPT) != 0) {
    if (!(f & CA_NOEXCEPT)) {
      Tick("op=(const Data&)");
    }
  }
  void operator=(DataTicker&&) noexcept((f & MA_NOEXCEPT) != 0) {
    if (!(f & MA_NOEXCEPT)) {
      Tick("op=(Data&&)");
    }
  }
};

//-----------------------------------------------------------------------------
// Operation counter

struct Counter {
  static int CountDC;
  static int CountCC;
  static int CountMC;
  static int CountOC;
  static int CountCA;
  static int CountMA;
  static int CountDestroy;
  static int CountTotalOps;
  static int CountLoggedConstruction;

  Counter() noexcept {
    CountTotalOps++;
    CountDC++;
  }
  Counter(const Counter&) noexcept {
    CountTotalOps++;
    CountCC++;
  }
  Counter(Counter&&) noexcept {
    CountTotalOps++;
    CountMC++;
  }
  explicit Counter(std::nullptr_t) noexcept {
    CountTotalOps++;
    CountOC++;
  }
  void operator=(const Counter&) noexcept {
    CountTotalOps++;
    CountCA++;
  }
  void operator=(Counter&&) noexcept {
    CountTotalOps++;
    CountMA++;
  }
  ~Counter() noexcept {
    CountTotalOps++;
    CountDestroy++;
  }
};

int Counter::CountDC = 0;
int Counter::CountCC = 0;
int Counter::CountMC = 0;
int Counter::CountOC = 0;
int Counter::CountCA = 0;
int Counter::CountMA = 0;
int Counter::CountDestroy = 0;
int Counter::CountTotalOps = 0;
int Counter::CountLoggedConstruction = 0;

//-----------------------------------------------------------------------------
// Tracker

struct Tracker {
  static int UID;
  static std::map<int, int> UIDCount;
  static int UIDTotal;
  static std::map<const Tracker*, int> Locations;
  static bool Print;

  Tracker* self;
  int uid;

  Tracker(Tracker* self, int uid) : self(self), uid(uid) {}
};

template <bool isRelocatable>
struct DataTracker : Tracker {
  DataTracker() noexcept : Tracker(this, UID++) {
    UIDCount[uid]++;
    UIDTotal++;
    if (!isRelocatable) {
      Locations[self] = uid;
    }
    print("Data()");
  }
  DataTracker(const DataTracker& o) noexcept : Tracker(this, o.uid) {
    UIDCount[uid]++;
    UIDTotal++;
    if (!isRelocatable) {
      Locations[self] = uid;
    }
    print("Data(const Data&)");
  }
  DataTracker(DataTracker&& o) noexcept : Tracker(this, o.uid) {
    UIDCount[uid]++;
    UIDTotal++;
    if (!isRelocatable) {
      Locations[self] = uid;
    }
    print("Data(Data&&)");
  }

  explicit DataTracker(int uid) noexcept : Tracker(this, uid) {
    UIDCount[uid]++;
    UIDTotal++;
    if (!isRelocatable) {
      Locations[self] = uid;
    }
    print("Data(int)");
  }

  ~DataTracker() noexcept {
    UIDCount[uid]--;
    UIDTotal--;
    if (!isRelocatable) {
      Locations.erase(self);
    }
    print("~Data()");
    uid = 0xdeadbeef;
    self = (DataTracker*)0xfeebdaed;
  }

  DataTracker& operator=(const DataTracker& o) noexcept {
    UIDCount[uid]--;
    uid = o.uid;
    UIDCount[uid]++;
    if (!isRelocatable) {
      Locations[self] = uid;
    }
    print("op=(const Data&)");
    return *this;
  }
  DataTracker& operator=(DataTracker&& o) noexcept {
    UIDCount[uid]--;
    uid = o.uid;
    UIDCount[uid]++;
    if (!isRelocatable) {
      Locations[self] = uid;
    }
    print("op=(Data&&)");
    return *this;
  }

  void print(const std::string& fun) {
    if (Print) {
      std::cerr << std::setw(20) << fun << ": uid = " << std::setw(3) << uid;
      if (!isRelocatable) {
        std::cerr << ", self = " << self;
      }
      std::cerr << std::endl;
    }
  }
};

int Tracker::UID = 1234;
std::map<int, int> Tracker::UIDCount;
int Tracker::UIDTotal = 0;
std::map<const Tracker*, int> Tracker::Locations;
bool Tracker::Print = false;

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
// Data

template <Flags f = 0, size_t pad = 0>
struct Data : DataTracker<(f & IS_RELOCATABLE) != 0>,
              Counter,
              DataTicker<f>,
              Delete<f> {
  static const Flags flags = f;
  char spacehog[pad ? pad : 1];

  Data() = default;
  Data(const Data&) = default;
  Data(Data&&) = default;
  /* implicit */ Data(int i)
      : DataTracker<(f & IS_RELOCATABLE) != 0>(i),
        Counter(),
        DataTicker<f>(nullptr),
        Delete<f>(nullptr) {}
  ~Data() = default;
  Data& operator=(const Data&) = default;
  Data& operator=(Data&&) = default;

 private:
  int operator&() const;
};

namespace folly {
template <Flags f, size_t pad>
struct IsRelocatable<Data<f, pad>> : bool_constant<(f & IS_RELOCATABLE) != 0> {
};
} // namespace folly

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
// Allocator

template <typename T>
struct isPropCopy : true_type {};
template <Flags f, size_t pad>
struct isPropCopy<Data<f, pad>> : bool_constant<(f & PROP_COPY) != 0> {};

template <typename T>
struct isPropMove : true_type {};
template <Flags f, size_t pad>
struct isPropMove<Data<f, pad>> : bool_constant<(f & PROP_MOVE) != 0> {};

template <typename T>
struct isPropSwap : true_type {};
template <Flags f, size_t pad>
struct isPropSwap<Data<f, pad>> : bool_constant<(f & PROP_SWAP) != 0> {};

struct AllocTracker {
  static int Constructed;
  static int Destroyed;
  static map<void*, size_t> Allocated;
  static map<void*, int> Owner;
};
int AllocTracker::Constructed = 0;
int AllocTracker::Destroyed = 0;
map<void*, size_t> AllocTracker::Allocated;
map<void*, int> AllocTracker::Owner;

template <class T>
struct Alloc : AllocTracker, Ticker {
  typedef typename std::allocator<T>::pointer pointer;
  typedef typename std::allocator<T>::const_pointer const_pointer;
  typedef typename std::allocator<T>::difference_type difference_type;
  typedef typename std::allocator<T>::size_type size_type;
  typedef typename std::allocator<T>::value_type value_type;

  //-----
  // impl

  std::allocator<T> a;
  int id;
  explicit Alloc(int i = 8) : a(), id(i) {}
  Alloc(const Alloc& o) : a(o.a), id(o.id) {}
  Alloc(Alloc&& o) noexcept : a(move(o.a)), id(o.id) {}
  Alloc& operator=(const Alloc&) = default;
  Alloc& operator=(Alloc&&) noexcept = default;
  bool operator==(const Alloc& o) const {
    return a == o.a && id == o.id;
  }
  bool operator!=(const Alloc& o) const {
    return !(*this == o);
  }

  //---------
  // tracking

  pointer allocate(size_type n) {
    if (n == 0) {
      cerr << "called allocate(0)" << endl;
      throw runtime_error("allocate fail");
    }
    Tick("allocate");
    auto p = a.allocate(n);
    Allocated[p] = n;
    Owner[p] = id;
    return p;
  }

  void deallocate(pointer p, size_type n) {
    if (p == nullptr) {
      cerr << "deallocate(nullptr, " << n << ")" << endl;
      FAIL() << "deallocate failed";
    }
    if (Allocated[p] != n) {
      cerr << "deallocate(" << p << ", " << n << ") invalid: ";
      if (Allocated[p] == 0) {
        cerr << "never allocated";
      } else if (Allocated[p] == size_t(-1)) {
        cerr << "already deallocated";
      } else {
        cerr << "wrong number (want " << Allocated[p] << ")";
      }
      cerr << endl;
      FAIL() << "deallocate failed";
    }
    if (Owner[p] != id) {
      cerr << "deallocate(" << p << "), where pointer is owned by " << Owner[p]
           << ", instead of self - " << id << endl;
      FAIL() << "deallocate failed";
    }
    Allocated[p] = -1;
    a.deallocate(p, n);
  }

  template <class U, class... Args>
  void construct(U* p, Args&&... args) {
    Tick("construct");
    a.construct(p, std::forward<Args>(args)...);
    Constructed++;
  }

  template <class U>
  void destroy(U* p) {
    Destroyed++;
    a.destroy(p);
  }

  //--------------
  // container ops

  Alloc select_on_container_copy_construction() const {
    Tick("select allocator for copy");
    return Alloc(id + 1);
  }

  typedef isPropCopy<T> propagate_on_container_copy_assignment;
  typedef isPropMove<T> propagate_on_container_move_assignment;
  typedef isPropSwap<T> propagate_on_container_swap;
};

//=============================================================================
//=============================================================================
// Verification and resetting

void softReset(int ticks = -1) {
  Counter::CountLoggedConstruction += Counter::CountDC + Counter::CountCC +
      Counter::CountMC + Counter::CountOC - Counter::CountDestroy;
  Counter::CountDC = Counter::CountCC = Counter::CountMC = Counter::CountOC =
      Counter::CountCA = Counter::CountMA = 0;
  Counter::CountDestroy = Counter::CountTotalOps = 0;
  Ticker::CountTicks = 0;
  Ticker::TicksLeft = ticks;
}

void hardReset() {
  Tracker::UIDCount.clear();
  Tracker::UIDTotal = 0;
  Tracker::Locations.clear();
  softReset();
  Counter::CountLoggedConstruction = 0;

  AllocTracker::Constructed = 0;
  AllocTracker::Destroyed = 0;
  AllocTracker::Allocated.clear();
  AllocTracker::Owner.clear();
}

int getTotal() {
  int con = Counter::CountDC + Counter::CountCC + Counter::CountMC +
      Counter::CountOC + Counter::CountLoggedConstruction;
  int del = Counter::CountDestroy;
  return con - del;
}

void isSane() {
  int tot = getTotal();
  ASSERT_GE(tot, 0) << "more objects deleted than constructed";

  ASSERT_EQ(tot, Tracker::UIDTotal)
      << "UIDTotal has incorrect number of objects";

  int altTot = 0;
  for (const auto& kv : Tracker::UIDCount) {
    ASSERT_TRUE(kv.second >= 0) << "there exists " << kv.second
                                << " Data "
                                   "with uid "
                                << kv.first;
    altTot += kv.second;
  }
  ASSERT_EQ(tot, altTot) << "UIDCount corrupted";

  if (!Tracker::Locations.empty()) { // implied by IsRelocatable
    ASSERT_EQ(tot, Tracker::Locations.size())
        << "Locations has incorrect number of objects";
    for (const auto& du : Tracker::Locations) {
      ASSERT_EQ(du.second, du.first->uid) << "Locations contains wrong uid";
      ASSERT_EQ(du.first, du.first->self) << "Data.self is corrupted";
    }
  }
}

//-----------------------------------------------------------------------------
// Traits

template <typename T>
struct is_copy_constructibleAndAssignable
    : bool_constant<
          std::is_copy_constructible<T>::value &&
          std::is_copy_assignable<T>::value> {};

template <typename T>
struct is_move_constructibleAndAssignable
    : bool_constant<
          std::is_move_constructible<T>::value &&
          std::is_move_assignable<T>::value> {};

template <class Vector>
struct customAllocator
    : bool_constant<!is_same<
          typename Vector::allocator_type,
          std::allocator<typename Vector::value_type>>::value> {};

template <typename T>
struct special_move_assignable : is_move_constructibleAndAssignable<T> {};
template <Flags f, size_t pad>
struct special_move_assignable<Data<f, pad>>
    : bool_constant<
          is_move_constructibleAndAssignable<Data<f, pad>>::value ||
          f & PROP_MOVE> {};

//=============================================================================
//=============================================================================
// Framework

//-----------------------------------------------------------------------------
// Timing

uint64_t ReadTSC() {
#ifdef _MSC_VER
  return __rdtsc();
#else
  unsigned reslo, reshi;

  __asm__ __volatile__("xorl %%eax,%%eax \n cpuid \n" ::
                           : "%eax", "%ebx", "%ecx", "%edx");
  __asm__ __volatile__("rdtsc\n" : "=a"(reslo), "=d"(reshi));
  __asm__ __volatile__("xorl %%eax,%%eax \n cpuid \n" ::
                           : "%eax", "%ebx", "%ecx", "%edx");

  return ((uint64_t)reshi << 32) | reslo;
#endif
}

//-----------------------------------------------------------------------------
// New Boost

// clang-format off
#define IBOOST_PP_VARIADIC_SIZE(...) IBOOST_PP_VARIADIC_SIZE_I(__VA_ARGS__,   \
  64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, \
  45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, \
  26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8,   \
  7, 6, 5, 4, 3, 2, 1,)
#define IBOOST_PP_VARIADIC_SIZE_I(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9,     \
  e10, e11, e12, e13, e14, e15, e16, e17, e18, e19, e20, e21, e22, e23, e24,  \
  e25, e26, e27, e28, e29, e30, e31, e32, e33, e34, e35, e36, e37, e38, e39,  \
  e40, e41, e42, e43, e44, e45, e46, e47, e48, e49, e50, e51, e52, e53, e54,  \
  e55, e56, e57, e58, e59, e60, e61, e62, e63, size, ...) size
// clang-format on
#define IBOOST_PP_VARIADIC_TO_SEQ(...) \
  BOOST_PP_TUPLE_TO_SEQ(IBOOST_PP_VARIADIC_SIZE(__VA_ARGS__), (__VA_ARGS__))

//-----------------------------------------------------------------------------
// STL_TEST

#define GEN_TEST(r, name, type)                                   \
  {                                                               \
    string atype = PrettyType<typename type::allocator_type>()(); \
    string ptype = PrettyType<typename type::value_type>()();     \
    SCOPED_TRACE("allocator: " + atype);                          \
    {                                                             \
      SCOPED_TRACE("datatype: " + ptype);                         \
      {                                                           \
        test_##name##3 < type > ();                               \
        if (::testing::Test::HasFatalFailure())                   \
          return;                                                 \
      }                                                           \
    }                                                             \
  }
#define GEN_TYPE_TEST(r, name, type) \
  if (0)                             \
    test_I_##name##3 < type > ();
#define GEN_RUNNABLE_TEST(r, name, type) \
  one = test_I_##name##3 < type > () || one;

#define GEN_LOOPER(r, d, arg) BOOST_PP_CAT(LOOPER_, arg)
#define GEN_VMAKER(r, d, arg) \
  {                           \
    BOOST_PP_CAT(VMAKER_, arg) {
#define GEN_UMAKER(r, d, arg) \
  }                           \
  BOOST_PP_CAT(UMAKER_, arg)  \
  }
#define GEN_CLOSER(r, d, arg) BOOST_PP_CAT(CLOSER_, arg)

#define TYPIFY(r, d, name) BOOST_PP_CAT(TYPIFY_, name)
#define ARGIFY(r, d, name) TYPIFY(r, d, name) name

// clang-format off
#define MAKE_TEST(ref, name, types, restriction, argseq, ...)              \
  template <class Vector> void test_ ## name ## 2 (std::false_type) {}     \
  template <class Vector> void test_ ## name ## 2 (std::true_type) {       \
    BOOST_PP_SEQ_FOR_EACH(GEN_LOOPER, _, argseq)                           \
    {                                                                      \
      SETUP                                                                \
      {                                                                    \
        BOOST_PP_SEQ_FOR_EACH(GEN_VMAKER, _, argseq)                       \
        {                                                                  \
          test_ ## name <Vector, typename Vector::value_type,              \
            typename Vector::allocator_type> ( __VA_ARGS__ );              \
          if (::testing::Test::HasFatalFailure()) {                        \
            return;                                                        \
          }                                                                \
        }                                                                  \
        BOOST_PP_SEQ_FOR_EACH(GEN_UMAKER, _, BOOST_PP_SEQ_REVERSE(argseq)) \
      }                                                                    \
      TEARDOWN                                                             \
    }                                                                      \
    BOOST_PP_SEQ_FOR_EACH(GEN_CLOSER, _, BOOST_PP_SEQ_REVERSE(argseq))     \
  }                                                                        \
  template <class Vector> void test_ ## name ## 3 () {                     \
    test_ ## name ## 2 <Vector> (bool_constant<                            \
        restriction<typename Vector::value_type>::value &&                 \
        is_copy_constructible<typename Vector::value_type>::value          \
      >());                                                                \
  }                                                                        \
                                                                           \
  template <class Vector> bool test_I_ ## name ## 2 (std::false_type)      \
    { return false; }                                                      \
  template <class Vector> bool test_I_ ## name ## 2 (std::true_type) {     \
    return true;                                                           \
    auto f = test_ ## name <Vector,                                        \
      typename Vector::value_type, typename Vector::allocator_type>;       \
    (void)f;                                                               \
    return true;                                                           \
  }                                                                        \
  template <class Vector> bool test_I_ ## name ## 3 () {                   \
    return test_I_ ## name ## 2 <Vector> (bool_constant<                   \
      restriction<typename Vector::value_type>::value>());                 \
    return false;                                                          \
  }                                                                        \
                                                                           \
  TEST(FBVector, name) {                                                   \
    SCOPED_TRACE("N3337 reference: " ref);                                 \
    BOOST_PP_SEQ_FOR_EACH(GEN_TEST, name, types)                           \
    BOOST_PP_SEQ_FOR_EACH(GEN_TYPE_TEST, name, INTERFACE_TYPES)            \
    bool one = false;                                                      \
    BOOST_PP_SEQ_FOR_EACH(GEN_RUNNABLE_TEST, name, types)                  \
    if (!one) {                                                            \
       FAIL() << "No tests qualified to run";                              \
    }                                                                      \
  }
// clang-format on

#define DECL(name, ...)                                      \
  template <class Vector, typename T, typename Allocator>    \
  void test_##name(BOOST_PP_SEQ_ENUM(BOOST_PP_SEQ_TRANSFORM( \
      ARGIFY, _, IBOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))))

#define STL_TEST_I(ref, name, restriction, ...) \
  DECL(name, __VA_ARGS__);                      \
  MAKE_TEST(                                    \
      ref,                                      \
      name,                                     \
      TEST_TYPES,                               \
      restriction,                              \
      IBOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__),   \
      __VA_ARGS__)                              \
  DECL(name, __VA_ARGS__)

#define STL_TEST(ref, name, restriction, ...) \
  STL_TEST_I(ref, name, restriction, z, ##__VA_ARGS__, ticks)

//-----------------------------------------------------------------------------
// Test Types

typedef Data<> ED1;
typedef Data<0, 4080> ED2;
typedef Data<MC_NOEXCEPT> ED3;
typedef Data<MC_NOEXCEPT | CC_DELETE> ED4;
typedef Data<IS_RELOCATABLE> ED5;

typedef VECTOR_<int, std::allocator<int>> _TVIS;
typedef VECTOR_<int, Alloc<int>> _TVI;
typedef VECTOR_<ED1, std::allocator<ED1>> _TV1;
typedef VECTOR_<ED2, std::allocator<ED2>> _TV2;
typedef VECTOR_<ED3, std::allocator<ED3>> _TV3;
typedef VECTOR_<ED4, std::allocator<ED4>> _TV4;
typedef VECTOR_<ED5, std::allocator<ED5>> _TV5v1;
typedef VECTOR_<ED5, Alloc<ED5>> _TV5;

typedef Data<PROP_COPY> EP1;
typedef Data<PROP_MOVE> EP2;
typedef Data<PROP_SWAP> EP3;

typedef VECTOR_<EP1, Alloc<EP1>> _TP1;
typedef VECTOR_<EP2, Alloc<EP2>> _TP2;
typedef VECTOR_<EP3, Alloc<EP3>> _TP3;

#define TEST_TYPES \
  (_TVIS)(_TVI)(_TV1)(_TV2)(_TV3)(_TV4)(_TV5v1)(_TV5)(_TP1)(_TP2)(_TP3)

typedef Data<ALL_DELETE> DD1; // unoperable
typedef Data<DC_DELETE | CC_DELETE | MC_DELETE> DD2; // unconstructible
typedef Data<CA_DELETE | MA_DELETE> DD3; // unassignable
typedef Data<CC_DELETE | MC_DELETE> DD4; // uncopyable
typedef Data<ALL_DELETE & ~DC_DELETE> DD5; // only default constructible
typedef Data<CC_DELETE> DD6; // move-only copy construction
typedef Data<CA_DELETE> DD7; // move-only assignment

typedef Data<ALL_DELETE | PROP_MOVE> DDSMA;
typedef VECTOR_<DDSMA, Alloc<DDSMA>> _TSpecialMA;

// clang-format off
#define INTERFACE_TYPES \
  (_TVI)(VECTOR_<DD1>)(VECTOR_<DD2>)(VECTOR_<DD3>) \
  (VECTOR_<DD4>)(VECTOR_<DD5>)(VECTOR_<DD6>) \
  (VECTOR_<DD7>)(_TSpecialMA)
// clang-format on

//-----------------------------------------------------------------------------
// Pretty printers

template <typename T>
struct PrettyType {
  string operator()() {
    if (is_same<T, int>::value) {
      return "int";
    }
    if (is_same<T, char>::value) {
      return "char";
    }
    if (is_same<T, uint64_t>::value) {
      return "uint64_t";
    }
    return typeid(T).name();
  }
};

template <Flags f, size_t pad>
struct PrettyType<Data<f, pad>> {
  string operator()() {
    stringstream tpe;
    tpe << "Data";

    if ((f & DC_DELETE) || (f & CC_DELETE) || (f & MC_DELETE) ||
        (f & CA_DELETE) || (f & MA_DELETE)) {
      tpe << "[^";
      if (f & DC_DELETE) {
        tpe << " DC,";
      }
      if (f & CC_DELETE) {
        tpe << " CC,";
      }
      if (f & MC_DELETE) {
        tpe << " MC,";
      }
      if (f & CA_DELETE) {
        tpe << " CA,";
      }
      if (f & MA_DELETE) {
        tpe << " MA,";
      }
      tpe << "]";
    }

    if ((f & DC_NOEXCEPT) || (f & CC_NOEXCEPT) || (f & MC_NOEXCEPT) ||
        (f & CA_NOEXCEPT) || (f & MA_NOEXCEPT)) {
      tpe << "[safe";
      if (f & DC_NOEXCEPT) {
        tpe << " DC,";
      }
      if (f & CC_NOEXCEPT) {
        tpe << " CC,";
      }
      if (f & MC_NOEXCEPT) {
        tpe << " MC,";
      }
      if (f & CA_NOEXCEPT) {
        tpe << " CA,";
      }
      if (f & MA_NOEXCEPT) {
        tpe << " MA,";
      }
      tpe << "]";
    }

    if (f & IS_RELOCATABLE) {
      tpe << "(relocatable)";
    }

    if (pad != 0) {
      tpe << "{pad " << pad << "}";
    }

    return tpe.str();
  }
};

template <typename T>
struct PrettyType<std::allocator<T>> {
  string operator()() {
    return "std::allocator<" + PrettyType<T>()() + ">";
  }
};

template <typename T>
struct PrettyType<Alloc<T>> {
  string operator()() {
    return "Alloc<" + PrettyType<T>()() + ">";
  }
};

//-----------------------------------------------------------------------------
// Setup, teardown, runup, rundown

// These four macros are run once per test. Setup and runup occur before the
// test, teardown and rundown after. Setup and runup straddle the
// initialization sequence, whereas rundown and teardown straddle the
// cleanup.

#define SETUP hardReset();
#define TEARDOWN

//-----------------------------------------------------------------------------
// Types and typegens

//------
// dummy

#define TYPIFY_z std::nullptr_t
#define LOOPER_z         \
  Vector* a_p = nullptr; \
  Vector* b_p = nullptr; \
  typename Vector::value_type* t_p = nullptr;
#define VMAKER_z std::nullptr_t z = nullptr;
#define UMAKER_z                            \
  verify<Vector>(0);                        \
  if (::testing::Test::HasFatalFailure()) { \
    return;                                 \
  }
#define CLOSER_z

//------
// ticks

#define VERIFICATION                      \
  if (b_p != nullptr)                     \
    verify(t_p != nullptr, *a_p, *b_p);   \
  else if (a_p != nullptr)                \
    verify(t_p != nullptr, *a_p);         \
  else                                    \
    verify<Vector>(t_p != nullptr);       \
  if (::testing::Test::HasFatalFailure()) \
    return;

#define TYPIFY_ticks int
#define LOOPER_ticks         \
  int _maxTicks_ = 0;        \
  bool ticks_thrown = false; \
  for (int ticks = -1; ticks < _maxTicks_; ++ticks) {
#define VMAKER_ticks                                      \
  string ticks_st = folly::to<string>("ticks = ", ticks); \
  SCOPED_TRACE(ticks_st);                                 \
  {                                                       \
    SCOPED_TRACE("pre-run verification");                 \
    VERIFICATION                                          \
  }                                                       \
  try {                                                   \
    softReset(ticks);
#define UMAKER_ticks                                                  \
  _maxTicks_ = Ticker::CountTicks;                                    \
  }                                                                   \
  catch (const TickException&) {                                      \
    ticks_thrown = true;                                              \
  }                                                                   \
  catch (const std::exception& e) {                                   \
    FAIL() << "EXCEPTION: " << e.what();                              \
  }                                                                   \
  catch (...) {                                                       \
    FAIL() << "UNKNOWN EXCEPTION";                                    \
  }                                                                   \
  if (ticks >= 0 && Ticker::CountTicks > ticks && !ticks_thrown)      \
    FAIL() << "CountTicks = " << Ticker::CountTicks << " > " << ticks \
           << " = ticks"                                              \
           << ", but no tick error was observed";                     \
  VERIFICATION
#define CLOSER_ticks }

//--------------------------------------------------
// vectors (second could be .equal, ==, or distinct)

static const vector<pair<int, int>> VectorSizes = {
    {0, -1},
    {1, -1},
    {2, -1},
    {10, -1},
    {10, 1},
    {10, 0},
#if !FOLLY_SANITIZE_ADDRESS
    {100, -1},
    {100, 1},
#endif

#if 0
    {10, -1},
    {10, 0},
    {10, 1},
    {10, 2},
    {10, 10},
    {100, -1},
    {100, 0},
    {100, 1},
    {100, 2},
    {100, 10},
    {100, 100},
    {1000, -1},
    {1000, 0},
    {1000, 1},
    {1000, 2},
    {1000, 10},
    {1000, 100},
    {1000, 1000},
#endif
};

int populateIndex = 1426;
template <class Vector>
void populate(Vector& v, const pair<int, int>& ss) {
  int i = 0;
  for (; i < ss.first; ++i) {
    v.emplace_back(populateIndex++);
  }
  if (ss.second >= 0) {
    while (v.capacity() - v.size() != size_t(ss.second)) {
      v.emplace_back(populateIndex++);
    }
  }
}

template <typename A>
struct allocGen {
  static A get() {
    return A();
  }
};
template <typename T>
struct allocGen<Alloc<T>> {
  static Alloc<T> get() {
    static int c = 0;
    c += 854;
    return Alloc<T>(c);
  }
};

#define TYPIFY_a Vector&
#define LOOPER_a for (const auto& a_ss : VectorSizes) {
#define VMAKER_a                                                            \
  Vector a(allocGen<typename Vector::allocator_type>::get());               \
  a_p = &a;                                                                 \
  populate(*a_p, a_ss);                                                     \
  string a_st = folly::to<string>("a (", a.size(), "/", a.capacity(), ")"); \
  SCOPED_TRACE(a_st);
#define UMAKER_a                          \
  verify(0, a);                           \
  if (::testing::Test::HasFatalFailure()) \
    return;
#define CLOSER_a }

#define TYPIFY_b Vector&
#define LOOPER_b for (int b_i = -2; b_i < (int)VectorSizes.size(); ++b_i) {
#define VMAKER_b                                                           \
  Vector b_s(allocGen<typename Vector::allocator_type>::get());            \
  b_p = &b_s;                                                              \
  string b_st;                                                             \
  if (b_i == -2) {                                                         \
    b_p = &a;                                                              \
    b_st = "b is an alias of a";                                           \
  } else if (b_i == -1) {                                                  \
    b_s.~Vector();                                                         \
    new (&b_s) Vector(a);                                                  \
    b_st = "b is a deep copy of a";                                        \
  } else {                                                                 \
    populate(b_s, VectorSizes[b_i]);                                       \
    b_st = folly::to<string>("b (", b_s.size(), "/", b_s.capacity(), ")"); \
  }                                                                        \
  Vector& b = *b_p;                                                        \
  SCOPED_TRACE(b_st);
#define UMAKER_b                          \
  verify(0, a, b);                        \
  if (::testing::Test::HasFatalFailure()) \
    return;
#define CLOSER_b }

//----
// int

static const vector<int> nSizes = {0, 1, 2, 9, 10, 11};

#define TYPIFY_n int
#define LOOPER_n for (int n : nSizes) {
#define VMAKER_n                              \
  string n_st = folly::to<string>("n = ", n); \
  SCOPED_TRACE(n_st);
#define UMAKER_n
#define CLOSER_n }

//-----------------------
// non-internal iterators

static int ijarr[12] = {0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89};
static int ijarC[12] = {0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89};

#define TYPIFY_i int*
#define LOOPER_i
#define VMAKER_i  \
  int* i = ijarr; \
  SCOPED_TRACE("i = fib[0]");
#define UMAKER_i
#define CLOSER_i

#define TYPIFY_j int*
#define LOOPER_j for (int j_i = 0; j_i < 12; ++j_i) {
#define VMAKER_j                                         \
  int* j = ijarr + j_i;                                  \
  string j_st = folly::to<string>("j = fib[", j_i, "]"); \
  SCOPED_TRACE(j_st);
#define UMAKER_j                     \
  for (int j_c = 0; j_c < 12; ++j_c) \
    ASSERT_EQ(ijarC[j_c], ijarr[j_c]);
#define CLOSER_j }

//-------------------
// internal iterators

template <class Vector>
std::pair<typename Vector::iterator, string> iterSpotter(Vector& v, int i) {
  typename Vector::iterator it;
  string msg;

  switch (i) {
    case 1:
      if (!v.empty()) {
        it = v.begin();
        ++it;
        msg = "a[1]";
        break;
      }
      FOLLY_FALLTHROUGH;
    case 0:
      it = v.begin();
      msg = "a.begin";
      break;

    case 2:
      if (!v.empty()) {
        it = v.end();
        --it;
        msg = "a[-1]";
        break;
      }
      FOLLY_FALLTHROUGH;
    case 3:
      it = v.end();
      msg = "a.end";
      break;

    default:
      cerr << "internal error" << endl;
      exit(1);
  }

  return make_pair(it, msg);
}

#define TYPIFY_p typename Vector::iterator
#define LOOPER_p for (int p_i = 0; p_i < 4; ++p_i) {
#define VMAKER_p                   \
  auto p_im = iterSpotter(a, p_i); \
  auto& p = p_im.first;            \
  auto& p_m = p_im.second;         \
  SCOPED_TRACE("p = " + p_m);
#define UMAKER_p
#define CLOSER_p }

#define TYPIFY_q typename Vector::iterator
#define LOOPER_q for (int q_i = p_i; q_i < 4; ++q_i) {
#define VMAKER_q                   \
  auto q_im = iterSpotter(a, q_i); \
  auto& q = q_im.first;            \
  auto& q_m = q_im.second;         \
  SCOPED_TRACE("q = " + q_m);
#define UMAKER_q
#define CLOSER_q }

//---------
// datatype

static const vector<int> tVals = {0, 1, 2, 3, 17, 66, 521};

#define TYPIFY_t typename Vector::value_type&
#define LOOPER_t for (int t_v : tVals) {
#define VMAKER_t                                   \
  typename Vector::value_type t_s(t_v);            \
  t_p = addressof(t_s);                            \
  string t_st = folly::to<string>("t(", t_v, ")"); \
  if (t_v < 4 && a_p != nullptr) {                 \
    auto t_im = iterSpotter(*a_p, t_v);            \
    if (t_im.first != a_p->end()) {                \
      t_p = addressof(*t_im.first);                \
      t_st = "t is " + t_im.second;                \
    }                                              \
  }                                                \
  typename Vector::value_type& t = *t_p;           \
  SCOPED_TRACE(t_st);
#define UMAKER_t
#define CLOSER_t }

//----------
// allocator

#define TYPIFY_m typename Vector::allocator_type
#define LOOPER_m                    \
  int m_max = 1 + (a_p != nullptr); \
  for (int m_i = 0; m_i < m_max; ++m_i) {
#define VMAKER_m                      \
  typename Vector::allocator_type m = \
      m_i == 0 ? typename Vector::allocator_type() : a_p->get_allocator();
#define UMAKER_m
#define CLOSER_m }

//-----------------------------------------------------------------------------
// Verifiers

// verify a vector
template <class Vector>
void verifyVector(const Vector& v) {
  ASSERT_TRUE(v.begin() <= v.end()) << "end is before begin";
  ASSERT_TRUE(v.empty() == (v.begin() == v.end())) << "empty != (begin == end)";
  ASSERT_TRUE(v.size() == size_t(distance(v.begin(), v.end())))
      << "size != end - begin";
  ASSERT_TRUE(v.size() <= v.capacity()) << "size > capacity";
  ASSERT_TRUE(v.capacity() <= v.max_size()) << "capacity > max_size";
  ASSERT_TRUE(v.data() || true); // message won't print - it will just crash
  ASSERT_TRUE(v.size() == 0 || v.data() != nullptr)
      << "nullptr data points to at least one element";
}

void verifyAllocator(int ele, int cap) {
  ASSERT_EQ(ele, AllocTracker::Constructed - AllocTracker::Destroyed);

  int tot = 0;
  for (auto kv : AllocTracker::Allocated) {
    if (kv.second != size_t(-1)) {
      tot += kv.second;
    }
  }
  ASSERT_EQ(cap, tot) << "the allocator counts " << tot
                      << " space, "
                         "but the vector(s) have (combined) capacity "
                      << cap;
}

// Master verifier
template <class Vector>
void verify(int extras) {
  if (!is_arithmetic<typename Vector::value_type>::value) {
    ASSERT_EQ(0 + extras, getTotal()) << "there exist Data but no vectors";
  }
  isSane();
  if (::testing::Test::HasFatalFailure()) {
    return;
  }
  if (customAllocator<Vector>::value) {
    verifyAllocator(0, 0);
  }
}
template <class Vector>
void verify(int extras, const Vector& v) {
  verifyVector(v);
  if (!is_arithmetic<typename Vector::value_type>::value) {
    ASSERT_EQ(v.size() + extras, getTotal())
        << "not all Data are in the vector";
  }
  isSane();
  if (::testing::Test::HasFatalFailure()) {
    return;
  }
  if (customAllocator<Vector>::value) {
    verifyAllocator(v.size(), v.capacity());
  }
}
template <class Vector>
void verify(int extras, const Vector& v1, const Vector& v2) {
  verifyVector(v1);
  verifyVector(v2);
  auto size = v1.size();
  auto cap = v1.capacity();
  if (&v1 != &v2) {
    size += v2.size();
    cap += v2.capacity();
  }
  if (!is_arithmetic<typename Vector::value_type>::value) {
    ASSERT_EQ(size + extras, getTotal()) << "not all Data are in the vector(s)";
  }
  isSane();
  if (::testing::Test::HasFatalFailure()) {
    return;
  }
  if (customAllocator<Vector>::value) {
    verifyAllocator(size, cap);
  }
}

//=============================================================================
// Helpers

// save the state of a vector
int convertToInt(int t) {
  return t;
}
template <Flags f, size_t pad>
int convertToInt(const Data<f, pad>& t) {
  return t.uid;
}
template <typename T>
int convertToInt(const std::allocator<T>&) {
  return -1;
}
template <typename T>
int convertToInt(const Alloc<T>& a) {
  return a.id;
}

template <class Vector>
class DataState {
  typedef typename Vector::size_type size_type;
  size_type size_;
  int* data_;

 public:
  /* implicit */ DataState(const Vector& v) {
    size_ = v.size();
    if (size_ != 0) {
      data_ = new int[size_];
      for (size_type i = 0; i < size_; ++i) {
        data_[i] = convertToInt(v.data()[i]);
      }
    } else {
      data_ = nullptr;
    }
  }
  ~DataState() {
    delete[] data_;
  }

  bool operator==(const DataState& o) const {
    if (size_ != o.size_) {
      return false;
    }
    for (size_type i = 0; i < size_; ++i) {
      if (data_[i] != o.data_[i]) {
        return false;
      }
    }
    return true;
  }

  int operator[](size_type i) {
    if (i >= size_) {
      cerr << "trying to access DataState out of bounds" << endl;
      exit(1);
    }
    return data_[i];
  }

  size_type size() {
    return size_;
  }
};

// downgrade iterators
template <typename It, class tag>
class Transformer : public boost::iterator_adaptor<
                        Transformer<It, tag>,
                        It,
                        typename iterator_traits<It>::value_type,
                        tag> {
  friend class boost::iterator_core_access;
  shared_ptr<set<It>> dereferenced;

 public:
  explicit Transformer(const It& it)
      : Transformer::iterator_adaptor_(it), dereferenced(new set<It>()) {}

  typename iterator_traits<It>::value_type& dereference() const {
    if (dereferenced->find(this->base_reference()) != dereferenced->end()) {
      cerr << "iterator dereferenced more than once" << endl;
      exit(1);
    }
    dereferenced->insert(this->base_reference());
    return *this->base_reference();
  }
};

template <typename It>
Transformer<It, forward_iterator_tag> makeForwardIterator(const It& it) {
  return Transformer<It, forward_iterator_tag>(it);
}
template <typename It>
Transformer<It, input_iterator_tag> makeInputIterator(const It& it) {
  return Transformer<It, input_iterator_tag>(it);
}

// mutate a value (in contract only)
void mutate(int& i) {
  if ((false)) {
    i = 0;
  }
}
void mutate(uint64_t& i) {
  if ((false)) {
    i = 0;
  }
}
template <Flags f, size_t pad>
void mutate(Data<f, pad>& ds) {
  if ((false)) {
    ds.uid = 0;
  }
}

//=============================================================================
// Tests

// #if 0

// #else

//-----------------------------------------------------------------------------
// Container

STL_TEST("23.2.1 Table 96.1-7", containerTypedefs, is_destructible) {
  static_assert(
      is_same<T, typename Vector::value_type>::value,
      "T != Vector::value_type");
  static_assert(
      is_same<T&, typename Vector::reference>::value,
      "T& != Vector::reference");
  static_assert(
      is_same<const T&, typename Vector::const_reference>::value,
      "const T& != Vector::const_reference");
  static_assert(
      is_convertible<
          typename iterator_traits<
              typename Vector::iterator>::iterator_category,
          forward_iterator_tag>::value,
      "Vector::iterator is not a forward iterator");
  static_assert(
      is_same<
          T,
          typename iterator_traits<typename Vector::iterator>::value_type>::
          value,
      "Vector::iterator does not iterate over type T");
  static_assert(
      is_convertible<
          typename iterator_traits<
              typename Vector::const_iterator>::iterator_category,
          forward_iterator_tag>::value,
      "Vector::const_iterator is not a forward iterator");
  static_assert(
      is_same<
          T,
          typename iterator_traits<
              typename Vector::const_iterator>::value_type>::value,
      "Vector::const_iterator does not iterate over type T");
  static_assert(
      is_convertible<
          typename Vector::iterator,
          typename Vector::const_iterator>::value,
      "Vector::iterator is not convertible to Vector::const_iterator");
  static_assert(
      is_signed<typename Vector::difference_type>::value,
      "Vector::difference_type is not signed");
  static_assert(
      is_same<
          typename Vector::difference_type,
          typename iterator_traits<
              typename Vector::iterator>::difference_type>::value,
      "Vector::difference_type != Vector::iterator::difference_type");
  static_assert(
      is_same<
          typename Vector::difference_type,
          typename iterator_traits<
              typename Vector::const_iterator>::difference_type>::value,
      "Vector::difference_type != Vector::const_iterator::difference_type");
  static_assert(
      is_unsigned<typename Vector::size_type>::value,
      "Vector::size_type is not unsigned");
  static_assert(
      sizeof(typename Vector::size_type) >=
          sizeof(typename Vector::difference_type),
      "Vector::size_type is smaller than Vector::difference_type");
}

STL_TEST("23.2.1 Table 96.8-9", emptyConstruction, is_destructible) {
  Vector u;

  ASSERT_TRUE(u.get_allocator() == Allocator());
  ASSERT_EQ(0, Counter::CountTotalOps);

  ASSERT_TRUE(u.empty()) << u.size();
  ASSERT_EQ(0, u.capacity());

  if (false) {
    Vector();
  }
}

STL_TEST("framework", populate, is_copy_constructible) {
  // We use emplace_back to construct vectors for testing, as well as size,
  // data, and capacity. We make sure these work before proceeding with tests.

  Vector u;
  ASSERT_EQ(0, u.size());
  ASSERT_EQ(nullptr, u.data());

  u.emplace_back(17);
  ASSERT_EQ(1, u.size());
  ASSERT_LT(u.capacity(), 100)
      << "single push_back increased capacity to " << u.capacity();
  ASSERT_NE(nullptr, u.data());
  ASSERT_EQ(17, convertToInt(u.data()[0]))
      << "first object did not get emplaced correctly";

  for (int i = 0; i < 3; ++i) {
    auto cap = u.capacity();
    while (u.size() < cap) {
      u.emplace_back(22);
      ASSERT_EQ(cap, u.capacity()) << "Vector grew when it did not need to";
      ASSERT_EQ(22, convertToInt(u.data()[u.size() - 1]))
          << "push_back with excess capacity failed";
    }

    ASSERT_EQ(cap, u.size());

    u.emplace_back(4);
    ASSERT_GT(u.capacity(), cap) << "capacity did not grow on overflow";
    ASSERT_EQ(cap + 1, u.size());
    ASSERT_EQ(4, convertToInt(u.data()[u.size() - 1]))
        << "grow object did not get emplaced correctly";
  }
}

STL_TEST("23.2.1 Table 96.10-11", copyConstruction, is_copy_constructible, a) {
  const auto& ca = a;
  DataState<Vector> dsa(ca);
  auto am = a.get_allocator();

  Vector u(ca);

  ASSERT_TRUE(
      std::allocator_traits<Allocator>::select_on_container_copy_construction(
          am) == u.get_allocator());
  ASSERT_TRUE(dsa == u);
  ASSERT_TRUE(
      (ca.data() == nullptr && u.data() == nullptr) || (ca.data() != u.data()))
      << "only a shallow copy was made";

  if (false) {
    Vector(ca2);
    Vector u2 = ca2;
  }
}

STL_TEST("23.2.1 Table 96.12", moveConstruction, is_destructible, a) {
  DataState<Vector> dsa(a);
  auto m = a.get_allocator();

  Vector u(move(a));

  ASSERT_TRUE(m == u.get_allocator());
  ASSERT_EQ(0, Counter::CountTotalOps);

  ASSERT_TRUE(dsa == u);

  if (false) {
    Vector u2 = move(a);
  }
}

STL_TEST("23.2.1 Table 96.13", moveAssignment, special_move_assignable, a, b) {
  DataState<Vector> dsb(b);
  auto am = a.get_allocator();
  auto bm = b.get_allocator();

  Vector& ret = a = std::move(b);

  if (std::allocator_traits<
          Allocator>::propagate_on_container_move_assignment::value) {
    ASSERT_TRUE(bm == a.get_allocator());
  } else {
    ASSERT_TRUE(am == a.get_allocator());
  }
  ASSERT_TRUE(&ret == &a);
  ASSERT_TRUE(&a == &b || dsb == a) << "move assignment did not create a copy";
  // The source of the move may be left in any (albeit valid) state.
}

STL_TEST("23.2.1 Table 96.14", destructible, is_destructible) {
  // The test generators check this clause already.
}

STL_TEST("23.2.1 Table 96.15-18", iterators, is_destructible, a) {
  DataState<Vector> dsa(a);
  const auto& ca = a;

  auto itb = a.begin();
  auto citb = ca.begin();
  auto Citb = a.cbegin();
  auto ite = a.end();
  auto cite = ca.end();
  auto Cite = a.cend();

  ASSERT_EQ(0, Counter::CountTotalOps);

  ASSERT_TRUE(dsa == a) << "call to begin or end modified internal data";

  ASSERT_TRUE(citb == Citb) << "cv.begin != v.cbegin";
  ASSERT_TRUE(cite == Cite) << "cv.end != v.cend";

  if (ca.size() == 0) {
    ASSERT_TRUE(itb == ite) << "begin != end when empty";
    ASSERT_TRUE(Citb == Cite) << "cbegin != cend when empty";
  } else {
    ASSERT_TRUE(itb != ite) << "begin == end when non-empty";
    ASSERT_TRUE(Citb != Cite) << "cbegin == cend when non-empty";
  }

  auto dist = size_t(std::distance(itb, ite));
  auto Cdist = size_t(std::distance(Citb, Cite));
  ASSERT_TRUE(dist == ca.size()) << "distance(begin, end) != size";
  ASSERT_TRUE(Cdist == ca.size()) << "distance(cbegin, cend) != size";
}

STL_TEST("23.2.1 Table 96.19-20", equitable, is_arithmetic, a, b) {
  const auto& ca = a;
  const auto& cb = b;
  DataState<Vector> dsa(a);
  DataState<Vector> dsb(b);

  ASSERT_TRUE((bool)(ca == cb) == (bool)(dsa == dsb))
      << "== does not return equality";
  ASSERT_TRUE((bool)(ca == cb) != (bool)(ca != cb))
      << "!= is not the opposite of ==";

  // Data is uncomparable, by design; therefore this test's restriction
  // is 'is_arithmetic'
}

STL_TEST("23.2.1 Table 96.21", memberSwappable, is_destructible, a, b) {
  if (!std::allocator_traits<Allocator>::propagate_on_container_swap::value &&
      convertToInt(a.get_allocator()) != convertToInt(b.get_allocator())) {
    // undefined behaviour
    return;
  }

  DataState<Vector> dsa(a);
  DataState<Vector> dsb(b);
  auto adata = a.data();
  auto bdata = b.data();
  auto am = a.get_allocator();
  auto bm = b.get_allocator();

  try {
    a.swap(b);
  } catch (...) {
    FAIL() << "swap is noexcept";
  }

  if (std::allocator_traits<Allocator>::propagate_on_container_swap::value) {
    ASSERT_TRUE(bm == a.get_allocator());
    ASSERT_TRUE(am == b.get_allocator());
  } else {
    ASSERT_TRUE(am == a.get_allocator());
    ASSERT_TRUE(bm == b.get_allocator());
  }
  ASSERT_EQ(0, Counter::CountTotalOps);

  ASSERT_TRUE(adata == b.data() && bdata == a.data());
  ASSERT_TRUE(dsa == b && dsb == a) << "swap did not swap";
}

STL_TEST("23.2.1 Table 96.22", nonmemberSwappable, is_destructible, a, b) {
  if (!std::allocator_traits<Allocator>::propagate_on_container_swap::value &&
      convertToInt(a.get_allocator()) != convertToInt(b.get_allocator())) {
    // undefined behaviour
    return;
  }

  DataState<Vector> dsa(a);
  DataState<Vector> dsb(b);
  auto adata = a.data();
  auto bdata = b.data();
  auto am = a.get_allocator();
  auto bm = b.get_allocator();

  try {
    swap(a, b);
  } catch (...) {
    FAIL() << "swap is noexcept";
  }

  if (std::allocator_traits<Allocator>::propagate_on_container_swap::value) {
    ASSERT_TRUE(bm == a.get_allocator());
    ASSERT_TRUE(am == b.get_allocator());
  } else {
    ASSERT_TRUE(am == a.get_allocator());
    ASSERT_TRUE(bm == b.get_allocator());
  }
  ASSERT_EQ(0, Counter::CountTotalOps);

  ASSERT_TRUE(adata == b.data() && bdata == a.data());
  ASSERT_TRUE(dsa == b && dsb == a) << "swap did not swap";
}

STL_TEST(
    "23.2.1 Table 96.23",
    copyAssign,
    is_copy_constructibleAndAssignable,
    a,
    b) {
  // it is possible to make use of just the copy constructor.

#ifdef USING_STD_VECTOR
  if (std::allocator_traits<
          Allocator>::propagate_on_container_copy_assignment::value &&
      convertToInt(a.get_allocator()) != convertToInt(b.get_allocator())) {
    // Bug. By the looks of things, in the above case, their bez is being
    // cleared and deallocated, but then the garbage pointers are being used.
    return;
  }
#endif

  const auto& cb = b;
  DataState<Vector> dsb(cb);
  auto am = a.get_allocator();
  auto bm = b.get_allocator();

  Vector& ret = a = cb;

  if (std::allocator_traits<
          Allocator>::propagate_on_container_copy_assignment::value) {
    ASSERT_TRUE(bm == a.get_allocator());
  } else {
    ASSERT_TRUE(am == a.get_allocator());
  }
  ASSERT_TRUE(&ret == &a);
  ASSERT_TRUE(dsb == a) << "copy-assign not equal to original";
}

STL_TEST("23.2.1 Table 96.24-26", sizeops, is_destructible) {
  // This check generators check this clause already.
}

//-----------------------------------------------------------------------------
// Reversible container

STL_TEST("23.2.1 Table 97.1-2", reversibleContainerTypedefs, is_destructible) {
  static_assert(
      is_same<
          typename Vector::reverse_iterator,
          std::reverse_iterator<typename Vector::iterator>>::value,
      "Vector::reverse_iterator != reverse_iterator<Vector:iterator");
  static_assert(
      is_same<
          typename Vector::const_reverse_iterator,
          std::reverse_iterator<typename Vector::const_iterator>>::value,
      "Vector::const_reverse_iterator != "
      "const_reverse_iterator<Vector::iterator");
}

STL_TEST("23.2.1 Table 97.3-5", reversibleIterators, is_destructible, a) {
  const auto& ca = a;
  DataState<Vector> ds(a);

  auto ritb = a.rbegin();
  auto critb = ca.rbegin();
  auto Critb = a.crbegin();
  auto rite = a.rend();
  auto crite = ca.rend();
  auto Crite = a.crend();

  ASSERT_EQ(0, Counter::CountTotalOps);

  ASSERT_TRUE(ds == a) << "call to rbegin or rend modified internal data";

  ASSERT_TRUE(critb == Critb) << "cv.rbegin != v.crbegin";
  ASSERT_TRUE(crite == Crite) << "cv.rend != v.crend";

  if (ca.size() == 0) {
    ASSERT_TRUE(ritb == rite) << "rbegin != rend when empty";
    ASSERT_TRUE(Critb == Crite) << "crbegin != crend when empty";
  } else {
    ASSERT_TRUE(ritb != rite) << "rbegin == rend when non-empty";
    ASSERT_TRUE(Critb != Crite) << "crbegin == crend when non-empty";
  }

  auto dist = size_t(std::distance(ritb, rite));
  auto Cdist = size_t(std::distance(Critb, Crite));
  ASSERT_TRUE(dist == ca.size()) << "distance(rbegin, rend) != size";
  ASSERT_TRUE(Cdist == ca.size()) << "distance(crbegin, crend) != size";
}

//-----------------------------------------------------------------------------
// Lexicographical functions

STL_TEST("23.2.1 Table 98", comparable, is_arithmetic) {
  const Vector v1 = {1, 2, 3, 4};
  const Vector v2 = {1, 2, 3, 4, 5};
  const Vector v3 = {1, 2, 2};
  const Vector v4 = {1, 2, 2, 4, 5};
  const Vector v5 = {};
  const Vector v6 = {1, 2, 3, 4};

  ASSERT_TRUE(v1 < v2);
  ASSERT_TRUE(v1 > v3);
  ASSERT_TRUE(v1 > v4);
  ASSERT_TRUE(v1 > v5);
  ASSERT_TRUE(v1 <= v6);
  ASSERT_TRUE(v1 >= v6);
}

//-----------------------------------------------------------------------------
// Allocator-aware requirements (AA)

STL_TEST("23.2.1 Table 99.1", allocatorTypedefs, is_destructible) {
  static_assert(
      is_same<T, typename Vector::allocator_type::value_type>::value,
      "Vector and vector's allocator value_type mismatch");
}

STL_TEST("23.2.1 Table 99.2", getAllocator, is_destructible) {
  // whitebox: ensure that a.get_allocator() returns a copy of its allocator
}

STL_TEST("23.2.1 Table 99.3", defaultAllocator, is_destructible) {
  // there is nothing new to test here
}

STL_TEST("23.2.1 Table 99.4", customAllocator, is_destructible, m) {
  const auto& cm = m;

  Vector u(cm);

  ASSERT_TRUE(u.get_allocator() == m);

  if (false) {
    Vector t(m);
  }
}

STL_TEST("23.2.1 Table 99.5", copyWithAllocator, is_copy_constructible, a, m) {
  DataState<Vector> dsa(a);
  const auto& ca = a;
  const auto& cm = m;

  Vector u(ca, cm);

  ASSERT_TRUE(u.get_allocator() == m);
  ASSERT_TRUE(dsa == u);
  ASSERT_TRUE(
      (ca.data() == nullptr && u.data() == nullptr) || (ca.data() != u.data()))
      << "only a shallow copy was made";
}

STL_TEST(
    "23.2.1 Table 99.6",
    moveConstructionWithAllocator,
    is_destructible,
    a) {
  (void)a;
  // there is nothing new to test here
}

STL_TEST(
    "23.2.1 Table 99.6",
    moveConstructionWithAllocatorSupplied,
    is_move_constructible,
    a,
    m) {
  bool deep = m != a.get_allocator();
  auto osize = a.size();
  auto oalloc = AllocTracker::Constructed;
  const auto& cm = m;

  Vector u(std::move(a), cm);

  ASSERT_TRUE(u.get_allocator() == m);

  if (deep) {
    if (!AllocTracker::Allocated.empty()) {
      ASSERT_EQ(osize, AllocTracker::Constructed - oalloc);
    }
  } else {
    ASSERT_EQ(0, Counter::CountTotalOps);
  }
}

STL_TEST("23.2.1 Table 99.7-9", allocAssign, is_destructible) {
  // there is nothing new to test here
}

STL_TEST("23.2.1-7", nAllocConstruction, is_copy_constructible, n, m) {
#ifndef USING_STD_VECTOR
  const auto& cm = m;

  Vector u(n, cm);

  ASSERT_TRUE(m == u.get_allocator());
#endif
}

STL_TEST("23.2.1-7", nCopyAllocConstruction, is_copy_constructible, n, t, m) {
  const auto& cm = m;
  const auto& ct = t;

  Vector u(n, ct, cm);

  ASSERT_TRUE(m == u.get_allocator());
}

STL_TEST(
    "23.2.1-7",
    forwardIteratorAllocConstruction,
    is_destructible,
    i,
    j,
    m) {
  auto fi = makeForwardIterator(i);
  auto fj = makeForwardIterator(j);
  const auto& cfi = fi;
  const auto& cfj = fj;
  const auto& cm = m;

  Vector u(cfi, cfj, cm);

  ASSERT_TRUE(m == u.get_allocator());
}

STL_TEST(
    "23.2.1-7",
    inputIteratorAllocConstruction,
    is_move_constructible,
    i,
    j,
    m) {
#ifdef USING_STD_VECTOR
  if (Ticker::TicksLeft >= 0)
    return;
#endif

  auto ii = makeInputIterator(i);
  auto ij = makeInputIterator(j);
  const auto& cii = ii;
  const auto& cij = ij;
  const auto& cm = m;

  Vector u(cii, cij, cm);

  ASSERT_TRUE(m == u.get_allocator());
}

STL_TEST("23.2.1-7", ilAllocConstruction, is_arithmetic, m) {
  // gcc fail
  if (Ticker::TicksLeft >= 0) {
    return;
  }

  const auto& cm = m;

  Vector u({1, 4, 7}, cm);

  ASSERT_TRUE(m == u.get_allocator());
}

//-----------------------------------------------------------------------------
// Data races

STL_TEST("23.2.2", dataRaces, is_destructible) {
  if (false) {
    const Vector* cv = nullptr;
    typename Vector::size_type* s = nullptr;

    cv->begin();
    cv->end();
    cv->rbegin();
    cv->rend();
    cv->front();
    cv->back();
    cv->data();

    (*cv).at(*s);
    (*cv)[*s];
  }

  // White-box: check that the non-const versions of each of the above
  // functions is implemented in terms of (or the same as) the const version
}

//-----------------------------------------------------------------------------
// Sequence container

STL_TEST("23.2.3 Table 100.1, alt", nConstruction, is_constructible, n) {
  Vector u(n);

  ASSERT_TRUE(Allocator() == u.get_allocator());
  ASSERT_EQ(n, u.size());
  ASSERT_EQ(Counter::CountTotalOps, Counter::CountDC);
}

STL_TEST("23.2.3 Table 100.1", nCopyConstruction, is_copy_constructible, n, t) {
  const auto& ct = t;

  Vector u(n, ct);

  ASSERT_TRUE(Allocator() == u.get_allocator());
  ASSERT_EQ(n, u.size()) << "Vector(n, t).size() != n" << endl;
  for (const auto& val : u) {
    ASSERT_EQ(convertToInt(t), convertToInt(val))
        << "not all elements of Vector(n, t) are equal to t";
  }
}

STL_TEST(
    "23.2.3 Table 100.2",
    forwardIteratorConstruction,
    is_destructible,
    i,
    j) {
  // All data is emplace-constructible from int, so we restrict to
  // is_destructible

  auto fi = makeForwardIterator(i);
  auto fj = makeForwardIterator(j);
  const auto& cfi = fi;
  const auto& cfj = fj;

  Vector u(cfi, cfj);

  ASSERT_TRUE(Allocator() == u.get_allocator());
  ASSERT_LE(Counter::CountTotalOps, j - i);

  ASSERT_EQ(j - i, u.size()) << "u(i,j).size() != j-i";
  for (auto it = u.begin(); it != u.end(); ++it, ++i) {
    ASSERT_EQ(*i, convertToInt(*it)) << "u(i,j) constructed incorrectly";
  }
}

STL_TEST(
    "23.2.3 Table 100.2",
    inputIteratorConstruction,
    is_move_constructible,
    i,
    j) {
#ifdef USING_STD_VECTOR
  if (Ticker::TicksLeft >= 0)
    return;
#endif

  auto ii = makeInputIterator(i);
  auto ij = makeInputIterator(j);
  const auto& cii = ii;
  const auto& cij = ij;

  Vector u(cii, cij);

  ASSERT_TRUE(Allocator() == u.get_allocator());
  ASSERT_EQ(j - i, u.size()) << "u(i,j).size() != j-i";
  for (auto it = u.begin(); it != u.end(); ++it, ++i) {
    ASSERT_EQ(*i, convertToInt(*it)) << "u(i,j) constructed incorrectly";
  }
}

STL_TEST("23.2.3 Table 100.3", ilConstruction, is_arithmetic) {
  // whitebox: ensure that Vector(il) is implemented in terms of
  // Vector(il.begin(), il.end())

  // gcc fail
  if (Ticker::TicksLeft >= 0) {
    return;
  }

  Vector u = {1, 4, 7};

  ASSERT_TRUE(Allocator() == u.get_allocator());
  ASSERT_EQ(3, u.size()) << "u(il).size() fail";
  int i = 1;
  auto it = u.begin();
  for (; it != u.end(); ++it, i += 3) {
    ASSERT_EQ(i, convertToInt(*it)) << "u(il) constructed incorrectly";
  }
}

STL_TEST("23.2.3 Table 100.4", ilAssignment, is_arithmetic, a) {
  // whitebox: ensure that assign(il) is implemented in terms of
  // assign(il.begin(), il.end())

  // gcc fail
  if (Ticker::TicksLeft >= 0) {
    return;
  }

  auto am = a.get_allocator();

  Vector& b = a = {1, 4, 7};

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_TRUE(&b == &a) << "'a = ...' did not return *this";

  ASSERT_EQ(3, a.size()) << "u(il).size() fail";
  int i = 1;
  auto it = a.begin();
  for (; it != a.end(); ++it, i += 3) {
    ASSERT_EQ(i, convertToInt(*it)) << "u(il) constructed incorrectly";
  }
}

//----------------------------
// insert-and-erase subsection

template <class Vector>
void insertNTCheck(
    const Vector& a,
    DataState<Vector>& dsa,
    int idx,
    int n,
    int val) {
  ASSERT_EQ(dsa.size() + n, a.size());
  int i = 0;
  for (; i < idx; ++i) {
    ASSERT_EQ(dsa[i], convertToInt(a.data()[i])) << i;
  }
  for (; i < idx + n; ++i) {
    ASSERT_EQ(val, convertToInt(a.data()[i])) << i;
  }
  for (; size_t(i) < a.size(); ++i) {
    ASSERT_EQ(dsa[i - n], convertToInt(a.data()[i])) << i;
  }
}

STL_TEST(
    "23.2.3 Table 100.5",
    iteratorEmplacement,
    is_move_constructibleAndAssignable,
    a,
    p) {
  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);
  auto am = a.get_allocator();

  auto q = a.emplace(p, 44);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(idx, distance(a.begin(), q)) << "incorrect iterator returned";
  insertNTCheck(a, dsa, idx, 1, 44);
}

STL_TEST(
    "23.2.3 Table 100.6",
    iteratorInsertion,
    is_copy_constructibleAndAssignable,
    a,
    p,
    t) {
  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);
  int tval = convertToInt(t);
  auto am = a.get_allocator();
  const auto& ct = t;

  auto q = a.insert(p, ct);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(idx, distance(a.begin(), q)) << "incorrect iterator returned";
  insertNTCheck(a, dsa, idx, 1, tval);
}

STL_TEST(
    "23.2.3 Table 100.7",
    iteratorInsertionRV,
    is_move_constructibleAndAssignable,
    a,
    p,
    t) {
  // rvalue-references cannot have their address checked for aliased inserts
  if (a.data() <= addressof(t) && addressof(t) < a.data() + a.size()) {
    return;
  }

  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);
  int tval = convertToInt(t);
  auto am = a.get_allocator();

  auto q = a.insert(p, std::move(t));

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(idx, distance(a.begin(), q)) << "incorrect iterator returned";
  insertNTCheck(a, dsa, idx, 1, tval);
}

STL_TEST(
    "23.2.3 Table 100.8",
    iteratorInsertionN,
    is_copy_constructibleAndAssignable,
    a,
    p,
    n,
    t) {
  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);
  int tval = convertToInt(t);
  auto am = a.get_allocator();
  const auto& ct = t;

#ifndef USING_STD_VECTOR
  auto q =
#endif

      a.insert(p, n, ct);

  ASSERT_TRUE(am == a.get_allocator());
#ifndef USING_STD_VECTOR
  ASSERT_EQ(idx, distance(a.begin(), q)) << "incorrect iterator returned";
#endif

  insertNTCheck(a, dsa, idx, n, tval);
}

template <class Vector>
void insertItCheck(
    const Vector& a,
    DataState<Vector>& dsa,
    int idx,
    int* b,
    int* e) {
  ASSERT_EQ(dsa.size() + (e - b), a.size());
  int i = 0;
  for (; i < idx; ++i) {
    ASSERT_EQ(dsa[i], convertToInt(a.data()[i]));
  }
  for (; i < idx + (e - b); ++i) {
    ASSERT_EQ(*(b + i - idx), convertToInt(a.data()[i]));
  }
  for (; size_t(i) < a.size(); ++i) {
    ASSERT_EQ(dsa[i - (e - b)], convertToInt(a.data()[i]));
  }
}

STL_TEST(
    "23.2.3 Table 100.9",
    iteratorInsertionIterator,
    is_move_constructibleAndAssignable,
    a,
    p,
    i,
    j) {
  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);

  auto fi = makeForwardIterator(i);
  auto fj = makeForwardIterator(j);
  auto am = a.get_allocator();
  const auto& cfi = fi;
  const auto& cfj = fj;

#ifndef USING_STD_VECTOR
  auto q =
#endif

      a.insert(p, cfi, cfj);

  ASSERT_TRUE(am == a.get_allocator());
#ifndef USING_STD_VECTOR
  ASSERT_EQ(idx, distance(a.begin(), q)) << "incorrect iterator returned";
#endif

  insertItCheck(a, dsa, idx, i, j);
}

STL_TEST(
    "23.2.3 Table 100.9",
    iteratorInsertionInputIterator,
    is_move_constructibleAndAssignable,
    a,
    p,
    i,
    j) {
  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);

  auto ii = makeInputIterator(i);
  auto ij = makeInputIterator(j);
  auto am = a.get_allocator();
  const auto& cii = ii;
  const auto& cij = ij;

#ifndef USING_STD_VECTOR
  auto q =
#endif

      a.insert(p, cii, cij);

  ASSERT_TRUE(am == a.get_allocator());
#ifndef USING_STD_VECTOR
  ASSERT_EQ(idx, distance(a.begin(), q)) << "incorrect iterator returned";
#endif

  insertItCheck(a, dsa, idx, i, j);
}

STL_TEST("23.2.3 Table 100.10", iteratorInsertIL, is_arithmetic, a, p) {
  // gcc fail
  if (Ticker::TicksLeft >= 0) {
    return;
  }

  // whitebox: ensure that insert(p, il) is implemented in terms of
  // insert(p, il.begin(), il.end())

  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);
  auto am = a.get_allocator();

#ifndef USING_STD_VECTOR
  auto q =
#endif

      a.insert(p, {1, 4, 7});

  ASSERT_TRUE(am == a.get_allocator());
#ifndef USING_STD_VECTOR
  ASSERT_EQ(idx, distance(a.begin(), q)) << "incorrect iterator returned";
#endif

  int ila[] = {1, 4, 7};
  int* i = ila;
  int* j = ila + 3;
  insertItCheck(a, dsa, idx, i, j);
}

template <class Vector>
void eraseCheck(Vector& a, DataState<Vector>& dsa, int idx, int n) {
  ASSERT_EQ(dsa.size() - n, a.size());
  int i = 0;
  auto it = a.begin();
  for (; it != a.end(); ++it, ++i) {
    if (i == idx) {
      i += n;
    }
    ASSERT_EQ(dsa[i], convertToInt(*it));
  }
}

STL_TEST("23.2.3 Table 100.11", iteratorErase, is_move_assignable, a, p) {
  if (p == a.end()) {
    return;
  }

  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);
  auto am = a.get_allocator();

  auto rit = a.erase(p);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(idx, distance(a.begin(), rit)) << "wrong iterator returned";
  eraseCheck(a, dsa, idx, 1);
}

STL_TEST(
    "23.2.3 Table 100.12",
    iteratorEraseRange,
    is_move_assignable,
    a,
    p,
    q) {
  if (p == a.end()) {
    return;
  }

  DataState<Vector> dsa(a);
  int idx = distance(a.begin(), p);
  auto am = a.get_allocator();

  auto rit = a.erase(p, q);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(idx, distance(a.begin(), rit)) << "wrong iterator returned";
  eraseCheck(a, dsa, idx, distance(p, q));
}

//--------------------------------
// end insert-and-erase subsection

STL_TEST("23.2.3 Table 100.13", clear, is_destructible, a) {
  auto am = a.get_allocator();

  try {
    a.clear();
  } catch (...) {
    FAIL() << "clear must be noexcept";
  }

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_TRUE(a.empty());
}

STL_TEST("23.2.3 Table 100.14", assignRange, is_move_assignable, a, i, j) {
  auto fi = makeForwardIterator(i);
  auto fj = makeForwardIterator(j);
  const auto& cfi = fi;
  const auto& cfj = fj;
  auto am = a.get_allocator();

  a.assign(cfi, cfj);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(distance(i, j), a.size());
  for (auto it = a.begin(); it != a.end(); ++it, ++i) {
    ASSERT_EQ(*i, convertToInt(*it));
  }
}

STL_TEST(
    "23.2.3 Table 100.14",
    assignInputRange,
    is_move_constructibleAndAssignable,
    a,
    i,
    j) {
  auto ii = makeInputIterator(i);
  auto ij = makeInputIterator(j);
  const auto& cii = ii;
  const auto& cij = ij;
  auto am = a.get_allocator();

  a.assign(cii, cij);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(distance(i, j), a.size());
  for (auto it = a.begin(); it != a.end(); ++it, ++i) {
    ASSERT_EQ(*i, convertToInt(*it));
  }
}

STL_TEST("23.2.3 Table 100.15", assignIL, is_arithmetic, a) {
  // whitebox: ensure that assign(il) is implemented in terms of
  // assign(il.begin(), il.end())

  // gcc fail
  if (Ticker::TicksLeft >= 0) {
    return;
  }

  auto am = a.get_allocator();

  a.assign({1, 4, 7});

  ASSERT_TRUE(am == a.get_allocator());
  int ila[] = {1, 4, 7};
  int* i = ila;

  ASSERT_EQ(3, a.size());
  for (auto it = a.begin(); it != a.end(); ++it, ++i) {
    ASSERT_EQ(*i, convertToInt(*it));
  }
}

STL_TEST(
    "23.2.3 Table 100.16",
    assignN,
    is_copy_constructibleAndAssignable,
    a,
    n,
    t) {
  auto am = a.get_allocator();
  auto const& ct = t;
  auto tval = convertToInt(t);

  a.assign(n, ct);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(n, a.size());
  for (auto it = a.begin(); it != a.end(); ++it) {
    ASSERT_EQ(tval, convertToInt(*it));
  }
}

STL_TEST("23.2.3 Table 101.1", front, is_destructible, a) {
  if (a.empty()) {
    return;
  }

  ASSERT_TRUE(addressof(a.front()) == a.data());

  ASSERT_EQ(0, Counter::CountTotalOps);

  if (false) {
    mutate(a.front());
    const Vector& ca = a;
    ca.front();
  }
}

STL_TEST("23.2.3 Table 101.2", back, is_destructible, a) {
  if (a.empty()) {
    return;
  }

  ASSERT_TRUE(addressof(a.back()) == a.data() + a.size() - 1);

  ASSERT_EQ(0, Counter::CountTotalOps);

  if (false) {
    mutate(a.back());
    const Vector& ca = a;
    ca.back();
  }
}

STL_TEST("23.2.3 Table 101.4", emplaceBack, is_move_constructible, a) {
  DataState<Vector> dsa(a);
  auto adata = a.data();
  int excess = a.capacity() - a.size();
  auto am = a.get_allocator();

  try {
    a.emplace_back(44);
  } catch (...) {
    ASSERT_TRUE(dsa == a) << "failed strong exception guarantee";
    throw;
  }

  ASSERT_TRUE(am == a.get_allocator());
  if (excess > 0) {
    ASSERT_TRUE(a.data() == adata) << "unnecessary relocation";
  }
  ASSERT_EQ(dsa.size() + 1, a.size());
  size_t i = 0;
  auto it = a.begin();
  for (; i < dsa.size(); ++i, ++it) {
    ASSERT_EQ(dsa[i], convertToInt(*it));
  }
  ASSERT_EQ(44, convertToInt(a.back()));
}

STL_TEST("23.2.3 Table 101.7", pushBack, is_copy_constructible, a, t) {
  DataState<Vector> dsa(a);
  int tval = convertToInt(t);
  auto adata = a.data();
  int excess = a.capacity() - a.size();
  auto am = a.get_allocator();
  const auto& ct = t;

  try {
    a.push_back(ct);
  } catch (...) {
    ASSERT_TRUE(dsa == a) << "failed strong exception guarantee";
    throw;
  }

  ASSERT_TRUE(am == a.get_allocator());
  if (excess > 0) {
    ASSERT_TRUE(a.data() == adata) << "unnecessary relocation";
  }
  ASSERT_EQ(dsa.size() + 1, a.size());
  size_t i = 0;
  auto it = a.begin();
  for (; i < dsa.size(); ++i, ++it) {
    ASSERT_EQ(dsa[i], convertToInt(*it));
  }
  ASSERT_EQ(tval, convertToInt(a.back()));
}

STL_TEST("23.2.3 Table 101.8", pushBackRV, is_move_constructible, a, t) {
  DataState<Vector> dsa(a);
  int tval = convertToInt(t);
  auto adata = a.data();
  int excess = a.capacity() - a.size();
  auto am = a.get_allocator();

  try {
    a.push_back(move(t));
  } catch (...) {
    ASSERT_TRUE(dsa == a) << "failed strong exception guarantee";
    throw;
  }

  ASSERT_TRUE(am == a.get_allocator());
  if (excess > 0) {
    ASSERT_TRUE(a.data() == adata) << "unnecessary relocation";
  }
  ASSERT_EQ(dsa.size() + 1, a.size());
  size_t i = 0;
  auto it = a.begin();
  for (; i < dsa.size(); ++i, ++it) {
    ASSERT_EQ(dsa[i], convertToInt(*it));
  }
  ASSERT_EQ(tval, convertToInt(a.back()));
}

STL_TEST("23.2.3 Table 100.10", popBack, is_destructible, a) {
  if (a.empty()) {
    return;
  }

  DataState<Vector> dsa(a);
  auto am = a.get_allocator();

  a.pop_back();

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(dsa.size() - 1, a.size());
  size_t i = 0;
  auto it = a.begin();
  for (; it != a.end(); ++it, ++i) {
    ASSERT_EQ(dsa[i], convertToInt(*it));
  }
}

STL_TEST("23.2.3 Table 100.11", operatorBrace, is_destructible, a) {
  const auto& ca = a;
  for (size_t i = 0; i < ca.size(); ++i) {
    ASSERT_TRUE(addressof(ca[i]) == ca.data() + i);
  }

  ASSERT_EQ(0, Counter::CountTotalOps);

  if (false) {
    mutate(a[0]);
  }
}

STL_TEST("23.2.3 Table 100.12", at, is_destructible, a) {
  const auto& ca = a;
  for (size_t i = 0; i < ca.size(); ++i) {
    ASSERT_TRUE(addressof(ca.at(i)) == ca.data() + i);
  }

  ASSERT_EQ(0, Counter::CountTotalOps);

  try {
    ca.at(ca.size());
    FAIL() << "at(size) should have thrown an error";
  } catch (const std::out_of_range& e) {
  } catch (...) {
    FAIL() << "at(size) threw error other than out_of_range";
  }

  if (false) {
    mutate(a.at(0));
  }
}

STL_TEST("move iterators", moveIterators, is_copy_constructibleAndAssignable) {
  if (false) {
    int* i = nullptr;
    int* j = nullptr;

    auto mfi = make_move_iterator(makeForwardIterator(i));
    auto mfj = make_move_iterator(makeForwardIterator(j));
    auto mii = make_move_iterator(makeInputIterator(i));
    auto mij = make_move_iterator(makeInputIterator(j));

    Vector u1(mfi, mfj);
    Vector u2(mii, mij);

    u1.insert(u1.begin(), mfi, mfj);
    u1.insert(u1.begin(), mii, mij);

    u1.assign(mfi, mfj);
    u1.assign(mii, mij);
  }
}

//-----------------------------------------------------------------------------
// Vector-specifics

STL_TEST("23.3.6.4", dataAndCapacity, is_destructible) {
  // there isn't anything new to test here - data and capacity are used as the
  // backbone of DataState. The minimal testing we might want to do is already
  // done in the populate test
}

STL_TEST("23.3.6.3", reserve, is_move_constructible, a, n) {
  auto adata = a.data();
  auto ocap = a.capacity();
  auto am = a.get_allocator();

  a.reserve(n);

  ASSERT_TRUE(am == a.get_allocator());
  if (size_t(n) <= ocap) {
    ASSERT_EQ(0, Counter::CountTotalOps);
    ASSERT_TRUE(adata == a.data());
  } else {
    ASSERT_TRUE(a.capacity() >= size_t(n));
    ASSERT_LE(Counter::CountTotalOps, 2 * a.size()); // move and delete
  }
}

STL_TEST("23.3.6.3", lengthError, is_move_constructible) {
  auto mx = Vector().max_size();
  auto big = mx + 1;
  if (mx >= big) {
    return; // max_size is the biggest size_type; overflowed
  }

  Vector u;
  try {
    u.reserve(big);
    FAIL() << "reserve(big) should have thrown an error";
  } catch (const std::length_error& e) {
  } catch (...) {
    FAIL() << "reserve(big) threw error other than length_error";
  }
}

STL_TEST("23.3.6.3", resize, is_copy_constructible, a, n) {
  DataState<Vector> dsa(a);
  int sz = a.size();
  auto am = a.get_allocator();

  a.resize(n);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(n, a.size());

  if (n <= sz) {
    for (int i = 0; i < n; ++i) {
      ASSERT_EQ(dsa[i], convertToInt(a[i]));
    }
  } else {
    for (int i = 0; i < sz; ++i) {
      ASSERT_EQ(dsa[i], convertToInt(a[i]));
    }
  }
}

STL_TEST("23.3.6.3", resizeT, is_copy_constructibleAndAssignable, a, n, t) {
#ifdef USING_STD_VECTOR
  if (a.data() <= addressof(t) && addressof(t) < a.data() + a.size())
    return;
#endif

  DataState<Vector> dsa(a);
  int sz = a.size();
  auto am = a.get_allocator();
  const auto& ct = t;
  int val = convertToInt(t);

  a.resize(n, ct);

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_EQ(n, a.size());

  if (n <= sz) {
    for (int i = 0; i < n; ++i) {
      ASSERT_EQ(dsa[i], convertToInt(a[i]));
    }
  } else {
    int i = 0;
    for (; i < sz; ++i) {
      ASSERT_EQ(dsa[i], convertToInt(a[i]));
    }
    for (; i < n; ++i) {
      ASSERT_EQ(val, convertToInt(a[i]));
    }
  }
}

STL_TEST("23.3.6.3", shrinkToFit, is_move_constructible, a) {
  bool willThrow = Ticker::TicksLeft >= 0;

  a.reserve(a.capacity() * 11);

  auto ocap = a.capacity();
  DataState<Vector> dsa(a);

  auto am = a.get_allocator();

  try {
    a.shrink_to_fit();
  } catch (...) {
    FAIL() << "shrink_to_fit should swallow errors";
  }

  ASSERT_TRUE(am == a.get_allocator());
  ASSERT_TRUE(dsa == a);
  if (willThrow) {
    // ASSERT_EQ(ocap, a.capacity()); might shrink in place
    throw TickException("I swallowed the error");
  } else {
    ASSERT_TRUE(a.capacity() == 0 || a.capacity() < ocap) << "Look into this";
  }
}

#ifndef USING_STD_VECTOR
STL_TEST("EBO", ebo, is_destructible) {
  static_assert(
      !is_same<Allocator, std::allocator<T>>::value ||
          sizeof(Vector) == 3 * sizeof(void*),
      "fbvector has default allocator, but has size != 3*sizeof(void*)");
}

STL_TEST("relinquish", relinquish, is_destructible, a) {
  auto sz = a.size();
  auto cap = a.capacity();
  auto data = a.data();

  auto guts = relinquish(a);

  ASSERT_EQ(data, guts);
  ASSERT_TRUE(a.empty());
  ASSERT_EQ(0, a.capacity());

  auto alloc = a.get_allocator();
  for (size_t i = 0; i < sz; ++i) {
    std::allocator_traits<decltype(alloc)>::destroy(alloc, guts + i);
  }
  if (guts != nullptr) {
    if (std::is_same<
            decltype(alloc),
            std::allocator<typename decltype(alloc)::value_type>>::value) {
      free(guts);
    } else {
      std::allocator_traits<decltype(alloc)>::deallocate(alloc, guts, cap);
    }
  }
}

STL_TEST("attach", attach, is_destructible, a) {
  DataState<Vector> dsa(a);

  auto sz = a.size();
  auto cap = a.capacity();
  auto guts = relinquish(a);

  ASSERT_EQ(a.data(), nullptr);
  attach(a, guts, sz, cap);

  ASSERT_TRUE(dsa == a);
}

#endif

// #endif

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  return RUN_ALL_TESTS();
}

FOLLY_POP_WARNING
