/*
 * Copyright 2016-present Facebook, Inc.
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
#define HAZPTR_STATS true
#define HAZPTR_SCAN_THRESHOLD 10

#include <folly/experimental/hazptr/hazptr.h>
#include <folly/experimental/hazptr/debug.h>
#include <folly/experimental/hazptr/example/LockFreeLIFO.h>
#include <folly/experimental/hazptr/example/MWMRSet.h>
#include <folly/experimental/hazptr/example/SWMRList.h>
#include <folly/experimental/hazptr/example/WideCAS.h>
#include <folly/experimental/hazptr/test/HazptrUse1.h>
#include <folly/experimental/hazptr/test/HazptrUse2.h>

#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

#include <condition_variable>

#include <thread>

DEFINE_int32(num_threads, 5, "Number of threads");
DEFINE_int64(num_reps, 1, "Number of test reps");
DEFINE_int64(num_ops, 1007, "Number of ops or pairs of ops per rep");

using namespace folly::hazptr;

class HazptrTest : public testing::Test {
 public:
  HazptrTest() : Test() {
    HAZPTR_DEBUG_PRINT("========== start of test scope");
  }
  ~HazptrTest() override {
    HAZPTR_DEBUG_PRINT("========== end of test scope");
  }
};

TEST_F(HazptrTest, Test1) {
  HAZPTR_DEBUG_PRINT("");
  Node1* node0 = (Node1*)malloc(sizeof(Node1));
  node0 = new (node0) Node1;
  HAZPTR_DEBUG_PRINT("=== malloc node0 " << node0 << " " << sizeof(*node0));
  Node1* node1 = (Node1*)malloc(sizeof(Node1));
  node1 = new (node1) Node1;
  HAZPTR_DEBUG_PRINT("=== malloc node1 " << node1 << " " << sizeof(*node1));
  Node1* node2 = (Node1*)malloc(sizeof(Node1));
  node2 = new (node2) Node1;
  HAZPTR_DEBUG_PRINT("=== malloc node2 " << node2 << " " << sizeof(*node2));
  Node1* node3 = (Node1*)malloc(sizeof(Node1));
  node3 = new (node3) Node1;
  HAZPTR_DEBUG_PRINT("=== malloc node3 " << node3 << " " << sizeof(*node3));

  HAZPTR_DEBUG_PRINT("");

  std::atomic<Node1*> shared0 = {node0};
  std::atomic<Node1*> shared1 = {node1};
  std::atomic<Node1*> shared2 = {node2};
  std::atomic<Node1*> shared3 = {node3};

  MyMemoryResource myMr;
  HAZPTR_DEBUG_PRINT("=== myMr " << &myMr);
  hazptr_domain myDomain0;
  HAZPTR_DEBUG_PRINT("=== myDomain0 " << &myDomain0);
  hazptr_domain myDomain1(&myMr);
  HAZPTR_DEBUG_PRINT("=== myDomain1 " << &myDomain1);

  HAZPTR_DEBUG_PRINT("");

  HAZPTR_DEBUG_PRINT("=== hptr0");
  hazptr_holder hptr0;
  HAZPTR_DEBUG_PRINT("=== hptr1");
  hazptr_holder hptr1(myDomain0);
  HAZPTR_DEBUG_PRINT("=== hptr2");
  hazptr_holder hptr2(myDomain1);
  HAZPTR_DEBUG_PRINT("=== hptr3");
  hazptr_holder hptr3;

  HAZPTR_DEBUG_PRINT("");

  Node1* n0 = shared0.load();
  Node1* n1 = shared1.load();
  Node1* n2 = shared2.load();
  Node1* n3 = shared3.load();

  CHECK(hptr0.try_protect(n0, shared0));
  CHECK(hptr1.try_protect(n1, shared1));
  hptr1.reset();
  hptr1.reset(nullptr);
  hptr1.reset(n2);
  CHECK(hptr2.try_protect(n3, shared3));
  swap(hptr1, hptr2);
  hptr3.reset();

  HAZPTR_DEBUG_PRINT("");

  HAZPTR_DEBUG_PRINT("=== retire n0 " << n0);
  n0->retire();
  HAZPTR_DEBUG_PRINT("=== retire n1 " << n1);
  n1->retire(default_hazptr_domain());
  HAZPTR_DEBUG_PRINT("=== retire n2 " << n2);
  n2->retire(myDomain0);
  HAZPTR_DEBUG_PRINT("=== retire n3 " << n3);
  n3->retire(myDomain1);
}

TEST_F(HazptrTest, Test2) {
  Node2* node0 = new Node2;
  HAZPTR_DEBUG_PRINT("=== new    node0 " << node0 << " " << sizeof(*node0));
  Node2* node1 = (Node2*)malloc(sizeof(Node2));
  node1 = new (node1) Node2;
  HAZPTR_DEBUG_PRINT("=== malloc node1 " << node1 << " " << sizeof(*node1));
  Node2* node2 = (Node2*)malloc(sizeof(Node2));
  node2 = new (node2) Node2;
  HAZPTR_DEBUG_PRINT("=== malloc node2 " << node2 << " " << sizeof(*node2));
  Node2* node3 = (Node2*)malloc(sizeof(Node2));
  node3 = new (node3) Node2;
  HAZPTR_DEBUG_PRINT("=== malloc node3 " << node3 << " " << sizeof(*node3));

  HAZPTR_DEBUG_PRINT("");

  std::atomic<Node2*> shared0 = {node0};
  std::atomic<Node2*> shared1 = {node1};
  std::atomic<Node2*> shared2 = {node2};
  std::atomic<Node2*> shared3 = {node3};

  MineMemoryResource mineMr;
  HAZPTR_DEBUG_PRINT("=== mineMr " << &mineMr);
  hazptr_domain mineDomain0;
  HAZPTR_DEBUG_PRINT("=== mineDomain0 " << &mineDomain0);
  hazptr_domain mineDomain1(&mineMr);
  HAZPTR_DEBUG_PRINT("=== mineDomain1 " << &mineDomain1);

  HAZPTR_DEBUG_PRINT("");

  HAZPTR_DEBUG_PRINT("=== hptr0");
  hazptr_holder hptr0;
  HAZPTR_DEBUG_PRINT("=== hptr1");
  hazptr_holder hptr1(mineDomain0);
  HAZPTR_DEBUG_PRINT("=== hptr2");
  hazptr_holder hptr2(mineDomain1);
  HAZPTR_DEBUG_PRINT("=== hptr3");
  hazptr_holder hptr3;

  HAZPTR_DEBUG_PRINT("");

  Node2* n0 = shared0.load();
  Node2* n1 = shared1.load();
  Node2* n2 = shared2.load();
  Node2* n3 = shared3.load();

  CHECK(hptr0.try_protect(n0, shared0));
  CHECK(hptr1.try_protect(n1, shared1));
  hptr1.reset();
  hptr1.reset(n2);
  CHECK(hptr2.try_protect(n3, shared3));
  swap(hptr1, hptr2);
  hptr3.reset();

  HAZPTR_DEBUG_PRINT("");

  HAZPTR_DEBUG_PRINT("=== retire n0 " << n0);
  n0->retire(default_hazptr_domain(), &mineReclaimFnDelete);
  HAZPTR_DEBUG_PRINT("=== retire n1 " << n1);
  n1->retire(default_hazptr_domain(), &mineReclaimFnFree);
  HAZPTR_DEBUG_PRINT("=== retire n2 " << n2);
  n2->retire(mineDomain0, &mineReclaimFnFree);
  HAZPTR_DEBUG_PRINT("=== retire n3 " << n3);
  n3->retire(mineDomain1, &mineReclaimFnFree);
}

TEST_F(HazptrTest, LIFO) {
  using T = uint32_t;
  CHECK_GT(FLAGS_num_threads, 0);
  for (int i = 0; i < FLAGS_num_reps; ++i) {
    HAZPTR_DEBUG_PRINT("========== start of rep scope");
    LockFreeLIFO<T> s;
    std::vector<std::thread> threads(FLAGS_num_threads);
    for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
      threads[tid] = std::thread([&s, tid]() {
        for (int j = tid; j < FLAGS_num_ops; j += FLAGS_num_threads) {
          s.push(j);
          T res;
          while (!s.pop(res)) {
            /* keep trying */
          }
        }
      });
    }
    for (auto& t : threads) {
      t.join();
    }
    HAZPTR_DEBUG_PRINT("========== end of rep scope");
  }
}

TEST_F(HazptrTest, SWMRLIST) {
  using T = uint64_t;

  CHECK_GT(FLAGS_num_threads, 0);
  for (int i = 0; i < FLAGS_num_reps; ++i) {
    HAZPTR_DEBUG_PRINT("========== start of rep scope");
    SWMRListSet<T> s;
    std::vector<std::thread> threads(FLAGS_num_threads);
    for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
      threads[tid] = std::thread([&s, tid]() {
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
      t.join();
    }
    HAZPTR_DEBUG_PRINT("========== end of rep scope");
  }
}

TEST_F(HazptrTest, MWMRSet) {
  using T = uint64_t;

  CHECK_GT(FLAGS_num_threads, 0);
  for (int i = 0; i < FLAGS_num_reps; ++i) {
    HAZPTR_DEBUG_PRINT("========== start of rep scope");
    MWMRListSet<T> s;
    std::vector<std::thread> threads(FLAGS_num_threads);
    for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
      threads[tid] = std::thread([&s, tid]() {
        for (int j = tid; j < FLAGS_num_ops; j += FLAGS_num_threads) {
          s.contains(j);
          s.add(j);
          s.remove(j);
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
      t.join();
    }
    HAZPTR_DEBUG_PRINT("========== end of rep scope");
  }
}

TEST_F(HazptrTest, WIDECAS) {
  WideCAS s;
  std::string u = "";
  std::string v = "11112222";
  auto ret = s.cas(u, v);
  CHECK(ret);
  u = "";
  v = "11112222";
  ret = s.cas(u, v);
  CHECK(!ret);
  u = "11112222";
  v = "22223333";
  ret = s.cas(u, v);
  CHECK(ret);
  u = "22223333";
  v = "333344445555";
  ret = s.cas(u, v);
  CHECK(ret);
}

TEST_F(HazptrTest, VirtualTest) {
  struct Thing : public hazptr_obj_base<Thing> {
    virtual ~Thing() {
      HAZPTR_DEBUG_PRINT("this: " << this << " &a: " << &a << " a: " << a);
    }
    int a;
  };
  for (int i = 0; i < 100; i++) {
    auto bar = new Thing;
    bar->a = i;

    hazptr_holder hptr;
    hptr.reset(bar);
    bar->retire();
    EXPECT_EQ(bar->a, i);
  }
}

void destructionTest(hazptr_domain& domain) {
  struct Thing : public hazptr_obj_base<Thing> {
    Thing* next;
    hazptr_domain* domain;
    int val;
    Thing(int v, Thing* n, hazptr_domain* d) : next(n), domain(d), val(v) {}
    ~Thing() {
      HAZPTR_DEBUG_PRINT(
          "this: " << this << " val: " << val << " next: " << next);
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
}

TEST_F(HazptrTest, DestructionTest) {
  {
    hazptr_domain myDomain0;
    destructionTest(myDomain0);
  }
  destructionTest(default_hazptr_domain());
}

TEST_F(HazptrTest, Move) {
  struct Foo : hazptr_obj_base<Foo> {
    int a;
  };
  for (int i = 0; i < 100; ++i) {
    Foo* x = new Foo;
    x->a = i;
    hazptr_holder hptr0;
    // Protect object
    hptr0.reset(x);
    // Retire object
    x->retire();
    // Move constructor - still protected
    hazptr_holder hptr1(std::move(hptr0));
    // Self move is no-op - still protected
    hazptr_holder* phptr1 = &hptr1;
    CHECK_EQ(phptr1, &hptr1);
    hptr1 = std::move(*phptr1);
    // Empty constructor
    hazptr_holder hptr2(nullptr);
    // Move assignment - still protected
    hptr2 = std::move(hptr1);
    // Access object
    CHECK_EQ(x->a, i);
    // Unprotect object - hptr2 is nonempty
    hptr2.reset();
  }
}

TEST_F(HazptrTest, Array) {
  struct Foo : hazptr_obj_base<Foo> {
    int a;
  };
  for (int i = 0; i < 100; ++i) {
    Foo* x = new Foo;
    x->a = i;
    hazptr_array<10> hptr;
    // Protect object
    hptr[9].reset(x);
    // Empty array
    hazptr_array<10> h(nullptr);
    // Move assignment
    h = std::move(hptr);
    // Retire object
    x->retire();
    // Unprotect object - hptr2 is nonempty
    h[9].reset();
  }
  {
    // Abnormal case
    hazptr_array<HAZPTR_TC_SIZE + 1> h;
    hazptr_array<HAZPTR_TC_SIZE + 1> h2(std::move(h));
  }
}

TEST_F(HazptrTest, ArrayDtorWithoutSpaceInTCache) {
  struct Foo : hazptr_obj_base<Foo> {
    int a;
  };
  {
    // Fill the thread cache
    hazptr_array<HAZPTR_TC_SIZE> w;
  }
  {
    // Emty array x
    hazptr_array<HAZPTR_TC_SIZE> x(nullptr);
    {
      // y ctor gets elements from the thread cache filled by w dtor.
      hazptr_array<HAZPTR_TC_SIZE> y;
      // z ctor gets elements from the default domain.
      hazptr_array<HAZPTR_TC_SIZE> z;
      // Elements of y are moved to x.
      x = std::move(y);
      // z dtor fills the thread cache.
    }
    // x dtor finds the thread cache full. It has to call
    // ~hazptr_holder() for each of its elements, which were
    // previously taken from the thread cache by y ctor.
  }
}

TEST_F(HazptrTest, Local) {
  struct Foo : hazptr_obj_base<Foo> {
    int a;
  };
  for (int i = 0; i < 100; ++i) {
    Foo* x = new Foo;
    x->a = i;
    hazptr_local<10> hptr;
    // Protect object
    hptr[9].reset(x);
    // Retire object
    x->retire();
    // Unprotect object - hptr2 is nonempty
    hptr[9].reset();
  }
  {
    // Abnormal case
    hazptr_local<HAZPTR_TC_SIZE + 1> h;
  }
}

/* Test ref counting */

std::atomic<int> constructed;
std::atomic<int> destroyed;

struct Foo : hazptr_obj_base_refcounted<Foo> {
  int val_;
  bool marked_;
  Foo* next_;
  Foo(int v, Foo* n) : val_(v), marked_(false), next_(n) {
    HAZPTR_DEBUG_PRINT("");
    constructed.fetch_add(1);
  }
  ~Foo() {
    HAZPTR_DEBUG_PRINT("");
    destroyed.fetch_add(1);
    if (marked_) {
      return;
    }
    auto next = next_;
    while (next) {
      if (!next->release_ref()) {
        return;
      }
      auto p = next;
      next = p->next_;
      p->marked_ = true;
      delete p;
    }
  }
};

struct Dummy : hazptr_obj_base<Dummy> {};

TEST_F(HazptrTest, basic_refcount) {
  constructed.store(0);
  destroyed.store(0);

  Foo* p = nullptr;
  int num = 20;
  for (int i = 0; i < num; ++i) {
    p = new Foo(i, p);
    if (i & 1) {
      p->acquire_ref_safe();
    } else {
      p->acquire_ref();
    }
  }
  hazptr_holder hptr;
  hptr.reset(p);
  for (auto q = p->next_; q; q = q->next_) {
    q->retire();
  }
  int v = num;
  for (auto q = p; q; q = q->next_) {
    CHECK_GT(v, 0);
    --v;
    CHECK_EQ(q->val_, v);
  }
  CHECK(!p->release_ref());
  CHECK_EQ(constructed.load(), num);
  CHECK_EQ(destroyed.load(), 0);
  p->retire();
  CHECK_EQ(constructed.load(), num);
  CHECK_EQ(destroyed.load(), 0);
  hptr.reset();

  /* retire enough objects to guarantee reclamation of Foo objects */
  for (int i = 0; i < 100; ++i) {
    auto a = new Dummy;
    a->retire();
  }

  CHECK_EQ(constructed.load(), num);
  CHECK_EQ(destroyed.load(), num);
}

TEST_F(HazptrTest, mt_refcount) {
  constructed.store(0);
  destroyed.store(0);

  std::atomic<bool> ready(false);
  std::atomic<int> setHazptrs(0);
  std::atomic<Foo*> head{nullptr};

  int num = 20;
  int nthr = 10;
  std::vector<std::thread> thr(nthr);
  for (int i = 0; i < nthr; ++i) {
    thr[i] = std::thread([&] {
      while (!ready.load()) {
        /* spin */
      }
      hazptr_holder hptr;
      auto p = hptr.get_protected(head);
      ++setHazptrs;
      /* Concurrent with removal */
      int v = num;
      for (auto q = p; q; q = q->next_) {
        CHECK_GT(v, 0);
        --v;
        CHECK_EQ(q->val_, v);
      }
      CHECK_EQ(v, 0);
    });
  }

  Foo* p = nullptr;
  for (int i = 0; i < num; ++i) {
    p = new Foo(i, p);
    p->acquire_ref_safe();
  }
  head.store(p);

  ready.store(true);

  while (setHazptrs.load() < nthr) {
    /* spin */
  }

  /* this is concurrent with traversal by reader */
  head.store(nullptr);
  for (auto q = p; q; q = q->next_) {
    q->retire();
  }
  HAZPTR_DEBUG_PRINT("Foo should not be destroyed");
  CHECK_EQ(constructed.load(), num);
  CHECK_EQ(destroyed.load(), 0);

  HAZPTR_DEBUG_PRINT("Foo may be destroyed after releasing the last reference");
  if (p->release_ref()) {
    delete p;
  }

  /* retire enough objects to guarantee reclamation of Foo objects */
  for (int i = 0; i < 100; ++i) {
    auto a = new Dummy;
    a->retire();
  }

  for (int i = 0; i < nthr; ++i) {
    thr[i].join();
  }

  CHECK_EQ(constructed.load(), num);
  CHECK_EQ(destroyed.load(), num);
}

TEST_F(HazptrTest, FreeFunctionRetire) {
  auto foo = new int;
  hazptr_retire(foo);
  auto foo2 = new int;
  hazptr_retire(foo2, [](int* obj) { delete obj; });

  bool retired = false;
  {
    hazptr_domain myDomain0;
    struct delret {
      bool* retired_;
      delret(bool* retire) : retired_(retire) {}
      ~delret() {
        *retired_ = true;
      }
    };
    auto foo3 = new delret(&retired);
    myDomain0.retire(foo3);
  }
  EXPECT_TRUE(retired);
}

TEST_F(HazptrTest, FreeFunctionCleanup) {
  CHECK_GT(FLAGS_num_threads, 0);
  int threadOps = 1007;
  int mainOps = 19;
  constructed.store(0);
  destroyed.store(0);
  std::atomic<int> threadsDone{0};
  std::atomic<bool> mainDone{false};
  std::vector<std::thread> threads(FLAGS_num_threads);
  for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
    threads[tid] = std::thread([&, tid]() {
      for (int j = tid; j < threadOps; j += FLAGS_num_threads) {
        auto p = new Foo(j, nullptr);
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
      auto p = new Foo(0, nullptr);
      p->retire();
    }
  }
  while (threadsDone.load() < FLAGS_num_threads) {
    /* spin */;
  }
  CHECK_EQ(constructed.load(), threadOps + mainOps);
  hazptr_cleanup();
  CHECK_EQ(destroyed.load(), threadOps + mainOps);
  mainDone.store(true);
  for (auto& t : threads) {
    t.join();
  }
  { // Cleanup after using array
    constructed.store(0);
    destroyed.store(0);
    { hazptr_array<2> h; }
    {
      hazptr_array<2> h;
      auto p0 = new Foo(0, nullptr);
      auto p1 = new Foo(0, nullptr);
      h[0].reset(p0);
      h[1].reset(p1);
      p0->retire();
      p1->retire();
    }
    CHECK_EQ(constructed.load(), 2);
    hazptr_cleanup();
    CHECK_EQ(destroyed.load(), 2);
  }
  { // Cleanup after using local
    constructed.store(0);
    destroyed.store(0);
    { hazptr_local<2> h; }
    {
      hazptr_local<2> h;
      auto p0 = new Foo(0, nullptr);
      auto p1 = new Foo(0, nullptr);
      h[0].reset(p0);
      h[1].reset(p1);
      p0->retire();
      p1->retire();
    }
    CHECK_EQ(constructed.load(), 2);
    hazptr_cleanup();
    CHECK_EQ(destroyed.load(), 2);
  }
}

TEST_F(HazptrTest, ForkTest) {
  struct Obj : hazptr_obj_base<Obj> {
    int a;
  };
  std::mutex m;
  std::condition_variable cv;
  std::condition_variable cv2;
  bool ready = false;
  bool ready2 = false;
  auto mkthread = [&]() {
    hazptr_holder h;
    auto p = new Obj;
    std::atomic<Obj*> ap{p};
    h.get_protected<Obj>(p);
    p->retire();
    {
      std::unique_lock<std::mutex> lk(m);
      ready = true;
      cv.notify_one();
      cv2.wait(lk, [&] { return ready2; });
    }
  };
  std::thread t(mkthread);
  hazptr_holder h;
  auto p = new Obj;
  std::atomic<Obj*> ap{p};
  h.get_protected<Obj>(p);
  p->retire();
  {
    std::unique_lock<std::mutex> lk(m);
    cv.wait(lk, [&] { return ready; });
  }
  auto pid = fork();
  CHECK_GE(pid, 0);
  if (pid) {
    {
      std::lock_guard<std::mutex> g(m);
      ready2 = true;
      cv2.notify_one();
    }
    t.join();
    int status;
    wait(&status);
    CHECK_EQ(status, 0);
  } else {
    // child
    std::thread tchild(mkthread);
    {
      std::lock_guard<std::mutex> g(m);
      ready2 = true;
      cv2.notify_one();
    }
    tchild.join();
    _exit(0); // Do not print gtest results
  }
}

TEST_F(HazptrTest, CopyAndMoveTest) {
  struct Obj : hazptr_obj_base<Obj> {
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
}
