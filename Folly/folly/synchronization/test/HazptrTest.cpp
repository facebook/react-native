/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/synchronization/Hazptr.h>
#include <folly/synchronization/example/HazptrLockFreeLIFO.h>
#include <folly/synchronization/example/HazptrSWMRSet.h>
#include <folly/synchronization/example/HazptrWideCAS.h>
#include <folly/synchronization/test/Barrier.h>

#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>
#include <folly/test/DeterministicSchedule.h>

#include <atomic>
#include <thread>

DEFINE_bool(bench, false, "run benchmark");
DEFINE_int64(num_reps, 10, "Number of test reps");
DEFINE_int32(num_threads, 6, "Number of threads");
DEFINE_int64(num_ops, 1003, "Number of ops or pairs of ops per rep");

using folly::default_hazptr_domain;
using folly::hazptr_array;
using folly::hazptr_cleanup;
using folly::hazptr_domain;
using folly::hazptr_holder;
using folly::hazptr_local;
using folly::hazptr_obj_base;
using folly::hazptr_obj_base_linked;
using folly::hazptr_retire;
using folly::hazptr_root;
using folly::hazptr_tc;
using folly::HazptrLockFreeLIFO;
using folly::HazptrSWMRSet;
using folly::HazptrWideCAS;
using folly::test::Barrier;
using folly::test::DeterministicAtomic;

using DSched = folly::test::DeterministicSchedule;

// Structures

/** Count */
class Count {
  std::atomic<int> ctors_{0};
  std::atomic<int> dtors_{0};
  std::atomic<int> retires_{0};

 public:
  void clear() noexcept {
    ctors_.store(0);
    dtors_.store(0);
    retires_.store(0);
  }

  int ctors() const noexcept {
    return ctors_.load();
  }

  int dtors() const noexcept {
    return dtors_.load();
  }

  int retires() const noexcept {
    return retires_.load();
  }

  void inc_ctors() noexcept {
    ctors_.fetch_add(1);
  }

  void inc_dtors() noexcept {
    dtors_.fetch_add(1);
  }

  void inc_retires() noexcept {
    retires_.fetch_add(1);
  }
}; // Count

static Count c_;

/** Node */
template <template <typename> class Atom = std::atomic>
class Node : public hazptr_obj_base<Node<Atom>, Atom> {
  int val_;
  Atom<Node<Atom>*> next_;

 public:
  explicit Node(int v = 0, Node* n = nullptr, bool = false) noexcept
      : val_(v), next_(n) {
    c_.inc_ctors();
  }

  ~Node() {
    c_.inc_dtors();
  }

  int value() const noexcept {
    return val_;
  }

  Node<Atom>* next() const noexcept {
    return next_.load(std::memory_order_acquire);
  }

  Atom<Node<Atom>*>* ptr_next() noexcept {
    return &next_;
  }
}; // Node

/** NodeRC */
template <bool Mutable, template <typename> class Atom = std::atomic>
class NodeRC : public hazptr_obj_base_linked<NodeRC<Mutable, Atom>, Atom> {
  Atom<NodeRC<Mutable, Atom>*> next_;
  int val_;

 public:
  explicit NodeRC(int v = 0, NodeRC* n = nullptr, bool acq = false) noexcept
      : next_(n), val_(v) {
    this->set_deleter();
    c_.inc_ctors();
    if (acq) {
      if (Mutable) {
        this->acquire_link_safe();
      } else {
        this->acquire_ref_safe();
      }
    }
  }

  ~NodeRC() {
    c_.inc_dtors();
  }

  int value() const noexcept {
    return val_;
  }

  NodeRC<Mutable, Atom>* next() const noexcept {
    return next_.load(std::memory_order_acquire);
  }

  template <typename S>
  void push_links(bool m, S& s) {
    if (Mutable == m) {
      auto p = next();
      if (p) {
        s.push(p);
      }
    }
  }
}; // NodeRC

/** List */
template <typename T, template <typename> class Atom = std::atomic>
struct List {
  Atom<T*> head_{nullptr};

 public:
  explicit List(int size) {
    auto p = head_.load(std::memory_order_relaxed);
    for (int i = 0; i < size - 1; ++i) {
      p = new T(i + 10000, p, true);
    }
    p = new T(size + 9999, p);
    head_.store(p, std::memory_order_relaxed);
  }

  ~List() {
    auto curr = head_.load(std::memory_order_relaxed);
    while (curr) {
      auto next = curr->next();
      curr->retire();
      curr = next;
    }
  }

  bool hand_over_hand(
      int val,
      hazptr_holder<Atom>* hptr_prev,
      hazptr_holder<Atom>* hptr_curr) {
    while (true) {
      auto prev = &head_;
      auto curr = prev->load(std::memory_order_acquire);
      while (true) {
        if (!curr) {
          return false;
        }
        if (!hptr_curr->try_protect(curr, *prev)) {
          break;
        }
        auto next = curr->next();
        if (prev->load(std::memory_order_acquire) != curr) {
          break;
        }
        if (curr->value() == val) {
          return true;
        }
        prev = curr->ptr_next();
        curr = next;
        std::swap(hptr_curr, hptr_prev);
      }
    }
  }

  bool hand_over_hand(int val) {
    hazptr_local<2, Atom> hptr;
    return hand_over_hand(val, &hptr[0], &hptr[1]);
  }

  bool protect_all(int val, hazptr_holder<Atom>& hptr) {
    auto curr = hptr.get_protected(head_);
    while (curr) {
      auto next = curr->next();
      if (curr->value() == val) {
        return true;
      }
      curr = next;
    }
    return false;
  }

  bool protect_all(int val) {
    hazptr_local<1, Atom> hptr;
    return protect_all(val, hptr[0]);
  }
}; // NodeRC

/** NodeAuto */
template <template <typename> class Atom = std::atomic>
class NodeAuto : public hazptr_obj_base_linked<NodeAuto<Atom>, Atom> {
  Atom<NodeAuto<Atom>*> link_[2];

 public:
  explicit NodeAuto(NodeAuto* l1 = nullptr, NodeAuto* l2 = nullptr) noexcept {
    this->set_deleter();
    link_[0].store(l1, std::memory_order_relaxed);
    link_[1].store(l2, std::memory_order_relaxed);
    c_.inc_ctors();
  }

  ~NodeAuto() {
    c_.inc_dtors();
  }

  NodeAuto<Atom>* link(size_t i) {
    return link_[i].load(std::memory_order_acquire);
  }

  template <typename S>
  void push_links(bool m, S& s) {
    if (m == false) { // Immutable
      for (int i = 0; i < 2; ++i) {
        auto p = link(i);
        if (p) {
          s.push(p);
        }
      }
    }
  }
}; // NodeAuto

// Test Functions

template <template <typename> class Atom = std::atomic>
void basic_objects_test() {
  c_.clear();
  int num = 0;
  {
    ++num;
    auto obj = new Node<Atom>;
    obj->retire();
  }
  {
    ++num;
    auto obj = new NodeRC<false, Atom>(0, nullptr);
    obj->retire();
  }
  {
    ++num;
    auto obj = new NodeRC<false, Atom>(0, nullptr);
    obj->acquire_link_safe();
    obj->unlink();
  }
  {
    ++num;
    auto obj = new NodeRC<false, Atom>(0, nullptr);
    obj->acquire_link_safe();
    obj->unlink_and_reclaim_unchecked();
  }
  {
    ++num;
    auto obj = new NodeRC<false, Atom>(0, nullptr);
    obj->acquire_link_safe();
    hazptr_root<NodeRC<false, Atom>> root(obj);
  }
  ASSERT_EQ(c_.ctors(), num);
  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.dtors(), num);
}

template <template <typename> class Atom = std::atomic>
void copy_and_move_test() {
  struct Obj : hazptr_obj_base<Obj, Atom> {
    int a;
  };

  auto p1 = new Obj();
  auto p2 = new Obj(*p1);
  p1->retire();
  p2->retire();

  p1 = new Obj();
  p2 = new Obj(std::move(*p1));
  p1->retire();
  p2->retire();

  p1 = new Obj();
  p2 = new Obj();
  *p2 = *p1;
  p1->retire();
  p2->retire();

  p1 = new Obj();
  p2 = new Obj();
  *p2 = std::move(*p1);
  p1->retire();
  p2->retire();
  hazptr_cleanup<Atom>();
}

template <template <typename> class Atom = std::atomic>
void basic_holders_test() {
  { hazptr_holder<Atom> h; }
  { hazptr_array<2, Atom> h; }
  { hazptr_local<2, Atom> h; }
}

template <template <typename> class Atom = std::atomic>
void basic_protection_test() {
  c_.clear();
  auto obj = new Node<Atom>;
  hazptr_holder<Atom> h;
  h.reset(obj);
  obj->retire();
  ASSERT_EQ(c_.ctors(), 1);
  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.dtors(), 0);
  h.reset();
  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.dtors(), 1);
}

template <template <typename> class Atom = std::atomic>
void virtual_test() {
  struct Thing : public hazptr_obj_base<Thing, Atom> {
    virtual ~Thing() {}
    int a;
  };
  for (int i = 0; i < 100; i++) {
    auto bar = new Thing;
    bar->a = i;

    hazptr_holder<Atom> hptr;
    hptr.reset(bar);
    bar->retire();
    ASSERT_EQ(bar->a, i);
  }
  hazptr_cleanup<Atom>();
}

template <template <typename> class Atom = std::atomic>
void destruction_test(hazptr_domain<Atom>& domain) {
  struct Thing : public hazptr_obj_base<Thing, Atom> {
    Thing* next;
    hazptr_domain<Atom>* domain;
    int val;
    Thing(int v, Thing* n, hazptr_domain<Atom>* d)
        : next(n), domain(d), val(v) {}
    ~Thing() {
      if (next) {
        next->retire(*domain);
      }
    }
  };
  Thing* last{nullptr};
  for (int i = 0; i < 2000; i++) {
    last = new Thing(i, last, &domain);
  }
  last->retire(domain);
  hazptr_cleanup<Atom>();
}

template <template <typename> class Atom = std::atomic>
void move_test() {
  for (int i = 0; i < 100; ++i) {
    auto x = new Node<Atom>(i);
    hazptr_holder<Atom> hptr0;
    // Protect object
    hptr0.reset(x);
    // Retire object
    x->retire();
    // Move constructor - still protected
    hazptr_holder<Atom> hptr1(std::move(hptr0));
    // Self move is no-op - still protected
    auto phptr1 = &hptr1;
    ASSERT_EQ(phptr1, &hptr1);
    hptr1 = std::move(*phptr1);
    // Empty constructor
    hazptr_holder<Atom> hptr2(nullptr);
    // Move assignment - still protected
    hptr2 = std::move(hptr1);
    // Access object
    ASSERT_EQ(x->value(), i);
    // Unprotect object - hptr2 is nonempty
    hptr2.reset();
  }
  hazptr_cleanup<Atom>();
}

template <template <typename> class Atom = std::atomic>
void array_test() {
  for (int i = 0; i < 100; ++i) {
    auto x = new Node<Atom>(i);
    hazptr_array<3, Atom> hptr;
    // Protect object
    hptr[2].reset(x);
    // Empty array
    hazptr_array<3, Atom> h(nullptr);
    // Move assignment
    h = std::move(hptr);
    // Retire object
    x->retire();
    ASSERT_EQ(x->value(), i);
    // Unprotect object - hptr2 is nonempty
    h[2].reset();
  }
  hazptr_cleanup<Atom>();
}

template <template <typename> class Atom = std::atomic>
void array_dtor_full_tc_test() {
#if FOLLY_HAZPTR_THR_LOCAL
  const uint8_t M = hazptr_tc<Atom>::capacity();
#else
  const uint8_t M = 3;
#endif
  {
    // Fill the thread cache
    hazptr_array<M, Atom> w;
  }
  {
    // Empty array x
    hazptr_array<M, Atom> x(nullptr);
    {
      // y ctor gets elements from the thread cache filled by w dtor.
      hazptr_array<M, Atom> y;
      // z ctor gets elements from the default domain.
      hazptr_array<M, Atom> z;
      // Elements of y are moved to x.
      x = std::move(y);
      // z dtor fills the thread cache.
    }
    // x dtor finds the thread cache full. It has to call
    // ~hazptr_holder() for each of its elements, which were
    // previously taken from the thread cache by y ctor.
  }
}

template <template <typename> class Atom = std::atomic>
void local_test() {
  for (int i = 0; i < 100; ++i) {
    auto x = new Node<Atom>(i);
    hazptr_local<3, Atom> hptr;
    // Protect object
    hptr[2].reset(x);
    // Retire object
    x->retire();
    // Unprotect object - hptr2 is nonempty
    hptr[2].reset();
  }
  hazptr_cleanup<Atom>();
}

template <bool Mutable, template <typename> class Atom = std::atomic>
void linked_test() {
  c_.clear();
  NodeRC<Mutable, Atom>* p = nullptr;
  int num = 193;
  for (int i = 0; i < num - 1; ++i) {
    p = new NodeRC<Mutable, Atom>(i, p, true);
  }
  p = new NodeRC<Mutable, Atom>(num - 1, p, Mutable);
  hazptr_holder<Atom> hptr;
  hptr.reset(p);
  if (!Mutable) {
    for (auto q = p->next(); q; q = q->next()) {
      q->retire();
    }
  }
  int v = num;
  for (auto q = p; q; q = q->next()) {
    ASSERT_GT(v, 0);
    --v;
    ASSERT_EQ(q->value(), v);
  }

  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.ctors(), num);
  ASSERT_EQ(c_.dtors(), 0);

  if (Mutable) {
    hazptr_root<NodeRC<Mutable, Atom>, Atom> root(p);
  } else {
    p->retire();
  }
  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.dtors(), 0);

  hptr.reset();
  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.dtors(), num);
}

template <bool Mutable, template <typename> class Atom = std::atomic>
void mt_linked_test() {
  c_.clear();

  Atom<bool> ready(false);
  Atom<bool> done(false);
  Atom<int> setHazptrs(0);
  hazptr_root<NodeRC<Mutable, Atom>, Atom> head;

  int num = FLAGS_num_ops;
  int nthr = FLAGS_num_threads;
  ASSERT_GT(FLAGS_num_threads, 0);
  std::vector<std::thread> thr(nthr);
  for (int i = 0; i < nthr; ++i) {
    thr[i] = DSched::thread([&] {
      while (!ready.load()) {
        /* spin */
      }
      hazptr_holder<Atom> hptr;
      auto p = hptr.get_protected(head());
      ++setHazptrs;
      /* Concurrent with removal */
      int v = num;
      for (auto q = p; q; q = q->next()) {
        ASSERT_GT(v, 0);
        --v;
        ASSERT_EQ(q->value(), v);
      }
      ASSERT_EQ(v, 0);
      while (!done.load()) {
        /* spin */
      }
    });
  }

  NodeRC<Mutable, Atom>* p = nullptr;
  for (int i = 0; i < num - 1; ++i) {
    p = new NodeRC<Mutable, Atom>(i, p, true);
  }
  p = new NodeRC<Mutable, Atom>(num - 1, p, Mutable);
  ASSERT_EQ(c_.ctors(), num);
  head().store(p);
  ready.store(true);
  while (setHazptrs.load() < nthr) {
    /* spin */
  }

  /* this is concurrent with traversal by readers */
  head().store(nullptr);
  if (Mutable) {
    p->unlink();
  } else {
    for (auto q = p; q; q = q->next()) {
      q->retire();
    }
  }
  ASSERT_EQ(c_.dtors(), 0);
  done.store(true);

  for (auto& t : thr) {
    DSched::join(t);
  }

  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.dtors(), num);
}

template <template <typename> class Atom = std::atomic>
void auto_retire_test() {
  c_.clear();
  auto d = new NodeAuto<Atom>;
  d->acquire_link_safe();
  auto c = new NodeAuto<Atom>(d);
  d->acquire_link_safe();
  auto b = new NodeAuto<Atom>(d);
  c->acquire_link_safe();
  b->acquire_link_safe();
  auto a = new NodeAuto<Atom>(b, c);
  hazptr_holder<Atom> h;
  {
    hazptr_root<NodeAuto<Atom>> root;
    a->acquire_link_safe();
    root().store(a);
    ASSERT_EQ(c_.ctors(), 4);
    /* So far the links and link counts are:
           root-->a  a-->b  a-->c  b-->d  c-->d
           a(1,0) b(1,0) c(1,0) d(2,0)
    */
    h.reset(c); /* h protects c */
    hazptr_cleanup<Atom>();
    ASSERT_EQ(c_.dtors(), 0);
    /* Nothing is retired or reclaimed yet */
  }
  /* root dtor calls a->unlink, which calls a->release_link, which
     changes a's link counts from (1,0) to (0,0), which triggers calls
     to c->downgrade_link, b->downgrade_link, and a->retire.

     c->downgrade_link changes c's link counts from (1,0) to (0,1),
     which triggers calls to d->downgrade_link and c->retire.

     d->downgrade_link changes d's link counts from (2,0) to (1,1).

     b->downgrade_link changes b's link counts from (1,0) to (0,1),
     which triggers calls to d->downgrade_link and b->retire.

     d->downgrade_link changes d's link counts from (1,1) to (0,2),
     which triggers a call to d->retire.

     So far (assuming retire-s did not trigger bulk_reclaim):
           a-->b  a-->c  b-->d  c-->d
           a(0,0) b(0,1) c(0,1) d(0,2)
           Retired: a b c d
           Protected: c
  */
  hazptr_cleanup<Atom>();
  /* hazptr_cleanup calls bulk_reclaim which finds a, b, and d
     unprotected, which triggers calls to a->release_ref,
     b->release_ref, and d->release_ref (not necessarily in that
     order).

     a->release_ref finds a's link counts to be (0,0), which triggers
     calls to c->release_ref, b->release_ref and delete a.

     The call to c->release_ref changes its link counts from (0,1) to
     (0,0).

     The first call to b->release_ref changes b's link counts to
     (0,0). The second call finds the link counts to be (0,0), which
     triggers a call to d->release_ref and delete b.

     The first call to d->release_ref changes its link counts to
     (0,1), and the second call changes them to (0,0);

     So far:
           c-->d
           a(deleted) b(deleted) c(0,0) d(0,0)
           Retired and protected: c
           bulk_reclamed-ed (i.e, found not protected): d
  */
  ASSERT_EQ(c_.dtors(), 2);
  h.reset(); /* c is now no longer protected */
  hazptr_cleanup<Atom>();
  /* hazptr_cleanup calls bulk_reclaim which finds c unprotected,
     which triggers a call to c->release_ref.

     c->release_ref finds c's link counts to be (0,0), which
     triggers calls to d->release_ref and delete c.

     d->release_ref finds d's link counts to be (0,0), which triggers
     a call to delete d.

     Finally:
           a(deleted) b(deleted) c(deleted) d(deleted)
  */
  ASSERT_EQ(c_.dtors(), 4);
}

template <template <typename> class Atom = std::atomic>
void free_function_retire_test() {
  auto foo = new int;
  hazptr_retire<Atom>(foo);
  auto foo2 = new int;
  hazptr_retire<Atom>(foo2, [](int* obj) { delete obj; });

  bool retired = false;
  {
    hazptr_domain<Atom> myDomain0;
    struct delret {
      bool* retired_;
      explicit delret(bool* retire) : retired_(retire) {}
      ~delret() {
        *retired_ = true;
      }
    };
    auto foo3 = new delret(&retired);
    myDomain0.retire(foo3);
  }
  ASSERT_TRUE(retired);
}

template <template <typename> class Atom = std::atomic>
void cleanup_test() {
  int threadOps = 1007;
  int mainOps = 19;
  c_.clear();
  Atom<int> threadsDone{0};
  Atom<bool> mainDone{false};
  std::vector<std::thread> threads(FLAGS_num_threads);
  for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
    threads[tid] = DSched::thread([&, tid]() {
      for (int j = tid; j < threadOps; j += FLAGS_num_threads) {
        auto p = new Node<Atom>;
        p->retire();
      }
      threadsDone.fetch_add(1);
      while (!mainDone.load()) {
        /* spin */;
      }
    });
  }
  { // include the main thread in the test
    for (int i = 0; i < mainOps; ++i) {
      auto p = new Node<Atom>;
      p->retire();
    }
  }
  while (threadsDone.load() < FLAGS_num_threads) {
    /* spin */;
  }
  ASSERT_EQ(c_.ctors(), threadOps + mainOps);
  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.dtors(), threadOps + mainOps);
  mainDone.store(true);
  for (auto& t : threads) {
    DSched::join(t);
  }
  { // Cleanup after using array
    c_.clear();
    { hazptr_array<2, Atom> h; }
    {
      hazptr_array<2, Atom> h;
      auto p0 = new Node<Atom>;
      auto p1 = new Node<Atom>;
      h[0].reset(p0);
      h[1].reset(p1);
      p0->retire();
      p1->retire();
    }
    ASSERT_EQ(c_.ctors(), 2);
    hazptr_cleanup<Atom>();
    ASSERT_EQ(c_.dtors(), 2);
  }
  { // Cleanup after using local
    c_.clear();
    { hazptr_local<2, Atom> h; }
    {
      hazptr_local<2, Atom> h;
      auto p0 = new Node<Atom>;
      auto p1 = new Node<Atom>;
      h[0].reset(p0);
      h[1].reset(p1);
      p0->retire();
      p1->retire();
    }
    ASSERT_EQ(c_.ctors(), 2);
    hazptr_cleanup<Atom>();
    ASSERT_EQ(c_.dtors(), 2);
  }
}

template <template <typename> class Atom = std::atomic>
void priv_dtor_test() {
  c_.clear();
  using NodeT = NodeRC<true, Atom>;
  auto y = new NodeT;
  y->acquire_link_safe();
  struct Foo : hazptr_obj_base<Foo, Atom> {
    hazptr_root<NodeT, Atom> r_;
  };
  auto x = new Foo;
  x->r_().store(y);
  /* Thread retires x. Dtor of TLS priv list pushes x to domain, which
     triggers bulk reclaim due to timed cleanup (when the test is run
     by itself). Reclamation of x unlinks and retires y. y should
     not be pushed into the thread's priv list. It should be pushed to
     domain instead. */
  auto thr = DSched::thread([&]() { x->retire(); });
  DSched::join(thr);
  ASSERT_EQ(c_.ctors(), 1);
  hazptr_cleanup<Atom>();
  ASSERT_EQ(c_.dtors(), 1);
}

template <template <typename> class Atom = std::atomic>
void lifo_test() {
  for (int i = 0; i < FLAGS_num_reps; ++i) {
    Atom<int> sum{0};
    HazptrLockFreeLIFO<int, Atom> s;
    std::vector<std::thread> threads(FLAGS_num_threads);
    for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
      threads[tid] = DSched::thread([&, tid]() {
        int local = 0;
        for (int j = tid; j < FLAGS_num_ops; j += FLAGS_num_threads) {
          s.push(j);
          int v;
          ASSERT_TRUE(s.pop(v));
          local += v;
        }
        sum.fetch_add(local);
      });
    }
    for (auto& t : threads) {
      DSched::join(t);
    }
    hazptr_cleanup<Atom>();
    int expected = FLAGS_num_ops * (FLAGS_num_ops - 1) / 2;
    ASSERT_EQ(sum.load(), expected);
  }
}

template <template <typename> class Atom = std::atomic>
void swmr_test() {
  using T = uint64_t;
  for (int i = 0; i < FLAGS_num_reps; ++i) {
    HazptrSWMRSet<T, Atom> s;
    std::vector<std::thread> threads(FLAGS_num_threads);
    for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
      threads[tid] = DSched::thread([&s, tid]() {
        for (int j = tid; j < FLAGS_num_ops; j += FLAGS_num_threads) {
          s.contains(j);
        }
      });
    }
    for (int j = 0; j < 10; ++j) {
      s.add(j);
    }
    for (int j = 0; j < 10; ++j) {
      s.remove(j);
    }
    for (auto& t : threads) {
      DSched::join(t);
    }
    hazptr_cleanup<Atom>();
  }
}

template <template <typename> class Atom = std::atomic>
void wide_cas_test() {
  HazptrWideCAS<std::string, Atom> s;
  std::string u = "";
  std::string v = "11112222";
  auto ret = s.cas(u, v);
  ASSERT_TRUE(ret);
  u = "";
  v = "11112222";
  ret = s.cas(u, v);
  ASSERT_FALSE(ret);
  u = "11112222";
  v = "22223333";
  ret = s.cas(u, v);
  ASSERT_TRUE(ret);
  u = "22223333";
  v = "333344445555";
  ret = s.cas(u, v);
  ASSERT_TRUE(ret);
  hazptr_cleanup<Atom>();
}

// Tests

TEST(HazptrTest, basic_objects) {
  basic_objects_test();
}

TEST(HazptrTest, dsched_basic_objects) {
  DSched sched(DSched::uniform(0));
  basic_objects_test<DeterministicAtomic>();
}

TEST(HazptrTest, copy_and_move) {
  copy_and_move_test();
}

TEST(HazptrTest, dsched_copy_and_move) {
  DSched sched(DSched::uniform(0));
  copy_and_move_test<DeterministicAtomic>();
}

TEST(HazptrTest, basic_holders) {
  basic_holders_test();
}

TEST(HazptrTest, dsched_basic_holders) {
  DSched sched(DSched::uniform(0));
  basic_holders_test<DeterministicAtomic>();
}

TEST(HazptrTest, basic_protection) {
  basic_protection_test();
}

TEST(HazptrTest, dsched_basic_protection) {
  DSched sched(DSched::uniform(0));
  basic_protection_test<DeterministicAtomic>();
}

TEST(HazptrTest, virtual) {
  virtual_test();
}

TEST(HazptrTest, dsched_virtual) {
  DSched sched(DSched::uniform(0));
  virtual_test<DeterministicAtomic>();
}

TEST(HazptrTest, destruction) {
  {
    hazptr_domain<> myDomain0;
    destruction_test(myDomain0);
  }
  destruction_test(default_hazptr_domain<std::atomic>());
}

TEST(HazptrTest, dsched_destruction) {
  DSched sched(DSched::uniform(0));
  {
    hazptr_domain<DeterministicAtomic> myDomain0;
    destruction_test<DeterministicAtomic>(myDomain0);
  }
  destruction_test<DeterministicAtomic>(
      default_hazptr_domain<DeterministicAtomic>());
}

TEST(HazptrTest, move) {
  move_test();
}

TEST(HazptrTest, dsched_move) {
  DSched sched(DSched::uniform(0));
  move_test<DeterministicAtomic>();
}

TEST(HazptrTest, array) {
  array_test();
}

TEST(HazptrTest, dsched_array) {
  DSched sched(DSched::uniform(0));
  array_test<DeterministicAtomic>();
}

TEST(HazptrTest, array_dtor_full_tc) {
  array_dtor_full_tc_test();
}

TEST(HazptrTest, dsched_array_dtor_full_tc) {
  DSched sched(DSched::uniform(0));
  array_dtor_full_tc_test<DeterministicAtomic>();
}

TEST(HazptrTest, local) {
  local_test();
}

TEST(HazptrTest, dsched_local) {
  DSched sched(DSched::uniform(0));
  local_test<DeterministicAtomic>();
}

TEST(HazptrTest, linked_mutable) {
  linked_test<true>();
}

TEST(HazptrTest, dsched_linked_mutable) {
  DSched sched(DSched::uniform(0));
  linked_test<true, DeterministicAtomic>();
}

TEST(HazptrTest, linked_immutable) {
  linked_test<false>();
}

TEST(HazptrTest, dsched_linked_immutable) {
  DSched sched(DSched::uniform(0));
  linked_test<false, DeterministicAtomic>();
}

TEST(HazptrTest, mt_linked_mutable) {
  mt_linked_test<true>();
}

TEST(HazptrTest, dsched_mt_linked_mutable) {
  DSched sched(DSched::uniform(0));
  mt_linked_test<true, DeterministicAtomic>();
}

TEST(HazptrTest, mt_linked_immutable) {
  mt_linked_test<false>();
}

TEST(HazptrTest, dsched_mt_linked_immutable) {
  DSched sched(DSched::uniform(0));
  mt_linked_test<false, DeterministicAtomic>();
}

TEST(HazptrTest, auto_retire) {
  auto_retire_test();
}

TEST(HazptrTest, dsched_auto_retire) {
  DSched sched(DSched::uniform(0));
  auto_retire_test<DeterministicAtomic>();
}

TEST(HazptrTest, free_function_retire) {
  free_function_retire_test();
}

TEST(HazptrTest, dsched_free_function_retire) {
  DSched sched(DSched::uniform(0));
  free_function_retire_test<DeterministicAtomic>();
}

TEST(HazptrTest, cleanup) {
  cleanup_test();
}

TEST(HazptrTest, dsched_cleanup) {
  DSched sched(DSched::uniform(0));
  cleanup_test<DeterministicAtomic>();
}

TEST(HazptrTest, priv_dtor) {
  priv_dtor_test();
}

TEST(HazptrTest, dsched_priv_dtor) {
  DSched sched(DSched::uniform(0));
  priv_dtor_test<DeterministicAtomic>();
}

TEST(HazptrTest, lifo) {
  lifo_test();
}

TEST(HazptrTest, dsched_lifo) {
  DSched sched(DSched::uniform(0));
  lifo_test<DeterministicAtomic>();
}

TEST(HazptrTest, swmr) {
  swmr_test();
}

TEST(HazptrTest, dsched_swmr) {
  DSched sched(DSched::uniform(0));
  swmr_test<DeterministicAtomic>();
}

TEST(HazptrTest, wide_cas) {
  wide_cas_test();
}

TEST(HazptrTest, dsched_wide_cas) {
  DSched sched(DSched::uniform(0));
  wide_cas_test<DeterministicAtomic>();
}

TEST(HazptrTest, reclamation_without_calling_cleanup) {
  c_.clear();
  int nthr = 5;
  int objs = folly::detail::hazptr_domain_rcount_threshold();
  std::vector<std::thread> thr(nthr);
  for (int tid = 0; tid < nthr; ++tid) {
    thr[tid] = std::thread([&, tid] {
      for (int i = tid; i < objs; i += nthr) {
        auto p = new Node<>;
        p->retire();
      }
    });
  }
  for (auto& t : thr) {
    t.join();
  }
  ASSERT_GT(c_.dtors(), 0);
}

// Benchmark drivers

template <typename InitFunc, typename Func, typename EndFunc>
uint64_t run_once(
    int nthreads,
    const InitFunc& init,
    const Func& fn,
    const EndFunc& endFn) {
  std::atomic<bool> start{false};
  Barrier b(nthreads + 1);
  init();
  std::vector<std::thread> threads(nthreads);
  for (int tid = 0; tid < nthreads; ++tid) {
    threads[tid] = std::thread([&, tid] {
      b.wait();
      fn(tid);
    });
  }
  b.wait();
  // begin time measurement
  auto tbegin = std::chrono::steady_clock::now();
  start.store(true);
  for (auto& t : threads) {
    t.join();
  }
  hazptr_cleanup();
  // end time measurement
  auto tend = std::chrono::steady_clock::now();
  endFn();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(tend - tbegin)
      .count();
}

template <typename RepFunc>
uint64_t bench(std::string name, int ops, const RepFunc& repFn) {
  int reps = 10;
  uint64_t min = UINTMAX_MAX;
  uint64_t max = 0;
  uint64_t sum = 0;

  repFn(); // sometimes first run is outlier
  for (int r = 0; r < reps; ++r) {
    uint64_t dur = repFn();
    sum += dur;
    min = std::min(min, dur);
    max = std::max(max, dur);
  }

  const std::string unit = " ns";
  uint64_t avg = sum / reps;
  uint64_t res = min;
  std::cout << name;
  std::cout << "   " << std::setw(4) << max / ops << unit;
  std::cout << "   " << std::setw(4) << avg / ops << unit;
  std::cout << "   " << std::setw(4) << res / ops << unit;
  std::cout << std::endl;
  return res;
}

//
// Benchmarks
//
// const int ops = 1000000;
const int ops = 1000000;

inline uint64_t holder_bench(std::string name, int nthreads) {
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int tid) {
      for (int j = tid; j < 10 * ops; j += nthreads) {
        hazptr_holder<> h;
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

template <size_t M>
inline uint64_t array_bench(std::string name, int nthreads) {
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int tid) {
      for (int j = tid; j < 10 * ops; j += nthreads) {
        hazptr_array<M> a;
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

template <size_t M>
inline uint64_t local_bench(std::string name, int nthreads) {
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int tid) {
      for (int j = tid; j < 10 * ops; j += nthreads) {
        hazptr_local<M> a;
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

inline uint64_t obj_bench(std::string name, int nthreads) {
  struct Foo : public hazptr_obj_base<Foo> {};
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int tid) {
      for (int j = tid; j < ops; j += nthreads) {
        auto p = new Foo;
        p->retire();
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

uint64_t list_hoh_bench(
    std::string name,
    int nthreads,
    int size,
    bool provided = false) {
  auto repFn = [&] {
    List<Node<>> l(size);
    auto init = [&] {};
    auto fn = [&](int tid) {
      if (provided) {
        hazptr_local<2> hptr;
        for (int j = tid; j < ops; j += nthreads) {
          l.hand_over_hand(size, &hptr[0], &hptr[1]);
        }
      } else {
        for (int j = tid; j < ops; j += nthreads) {
          l.hand_over_hand(size);
        }
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

uint64_t list_protect_all_bench(
    std::string name,
    int nthreads,
    int size,
    bool provided = false) {
  auto repFn = [&] {
    List<NodeRC<true>> l(size);
    auto init = [] {};
    auto fn = [&](int tid) {
      if (provided) {
        hazptr_local<1> hptr;
        for (int j = tid; j < ops; j += nthreads) {
          l.protect_all(size, hptr[0]);
        }
      } else {
        for (int j = tid; j < ops; j += nthreads) {
          l.protect_all(size);
        }
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

uint64_t cleanup_bench(std::string name, int nthreads) {
  auto repFn = [&] {
    auto init = [] {};
    auto fn = [&](int) {
      hazptr_holder<std::atomic> hptr;
      for (int i = 0; i < 1000; i++) {
        hazptr_cleanup();
      }
    };
    auto endFn = [] {};
    return run_once(nthreads, init, fn, endFn);
  };
  return bench(name, ops, repFn);
}

const int nthr[] = {1, 10};
const int sizes[] = {10, 20};

void benches() {
  for (int i : nthr) {
    std::cout << "================================ " << std::setw(2) << i
              << " threads "
              << "================================" << std::endl;
    std::cout << "10x construct/destruct hazptr_holder          ";
    holder_bench("", i);
    std::cout << "10x construct/destruct hazptr_array<1>        ";
    array_bench<1>("", i);
    std::cout << "10x construct/destruct hazptr_array<2>        ";
    array_bench<2>("", i);
    std::cout << "10x construct/destruct hazptr_array<3>        ";
    array_bench<3>("", i);
    std::cout << "10x construct/destruct hazptr_local<1>        ";
    local_bench<1>("", i);
    std::cout << "10x construct/destruct hazptr_local<2>        ";
    local_bench<2>("", i);
    std::cout << "10x construct/destruct hazptr_local<3>        ";
    local_bench<3>("", i);
    std::cout << "allocate/retire/reclaim object                ";
    obj_bench("", i);
    for (int j : sizes) {
      std::cout << j << "-item list hand-over-hand - own hazptrs     ";
      list_hoh_bench("", i, j, true);
      std::cout << j << "-item list hand-over-hand                   ";
      list_hoh_bench("", i, j);
      std::cout << j << "-item list protect all - own hazptr         ";
      list_protect_all_bench("", i, j, true);
      std::cout << j << "-item list protect all                      ";
      list_protect_all_bench("", i, j);
    }
    std::cout << "hazptr_cleanup                                ";
    cleanup_bench("", i);
  }
}

TEST(HazptrTest, bench) {
  if (FLAGS_bench) {
    benches();
  }
}

/*
$ numactl -N 1 ./buck-out/gen/folly/synchronization/test/hazptr_test --bench

================================  1 threads ================================
10x construct/destruct hazptr_holder               51 ns     51 ns     50 ns
10x construct/destruct hazptr_array<1>             54 ns     52 ns     52 ns
10x construct/destruct hazptr_array<2>             60 ns     59 ns     58 ns
10x construct/destruct hazptr_array<3>            141 ns     88 ns     82 ns
10x construct/destruct hazptr_local<1>             13 ns     12 ns     12 ns
10x construct/destruct hazptr_local<2>             15 ns     15 ns     15 ns
10x construct/destruct hazptr_local<3>             39 ns     39 ns     38 ns
allocate/retire/reclaim object                     70 ns     68 ns     67 ns
10-item list hand-over-hand - own hazptrs          22 ns     20 ns     18 ns
10-item list hand-over-hand                        28 ns     25 ns     22 ns
10-item list protect all - own hazptr              12 ns     11 ns     11 ns
10-item list protect all                           22 ns     13 ns     12 ns
20-item list hand-over-hand - own hazptrs          42 ns     40 ns     38 ns
20-item list hand-over-hand                        48 ns     43 ns     41 ns
20-item list protect all - own hazptr              28 ns     28 ns     28 ns
20-item list protect all                           31 ns     29 ns     29 ns
hazptr_cleanup                                      2 ns      1 ns      1 ns
================================ 10 threads ================================
10x construct/destruct hazptr_holder               11 ns      8 ns      8 ns
10x construct/destruct hazptr_array<1>              8 ns      7 ns      7 ns
10x construct/destruct hazptr_array<2>              9 ns      9 ns      9 ns
10x construct/destruct hazptr_array<3>             19 ns     17 ns     14 ns
10x construct/destruct hazptr_local<1>              8 ns      8 ns      8 ns
10x construct/destruct hazptr_local<2>              8 ns      8 ns      7 ns
10x construct/destruct hazptr_local<3>             11 ns     11 ns     10 ns
allocate/retire/reclaim object                     20 ns     17 ns     16 ns
10-item list hand-over-hand - own hazptrs           3 ns      3 ns      3 ns
10-item list hand-over-hand                         3 ns      3 ns      3 ns
10-item list protect all - own hazptr               2 ns      2 ns      2 ns
10-item list protect all                            2 ns      2 ns      2 ns
20-item list hand-over-hand - own hazptrs           6 ns      6 ns      6 ns
20-item list hand-over-hand                         6 ns      6 ns      6 ns
20-item list protect all - own hazptr               4 ns      4 ns      4 ns
20-item list protect all                            5 ns      4 ns      4 ns
hazptr_cleanup                                    119 ns    113 ns     97 ns
 */
