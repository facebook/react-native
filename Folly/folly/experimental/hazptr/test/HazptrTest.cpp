/*
 * Copyright 2017 Facebook, Inc.
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
#include <folly/experimental/hazptr/test/HazptrUse1.h>
#include <folly/experimental/hazptr/test/HazptrUse2.h>
#include <folly/experimental/hazptr/example/LockFreeLIFO.h>
#include <folly/experimental/hazptr/example/SWMRList.h>
#include <folly/experimental/hazptr/example/WideCAS.h>
#include <folly/experimental/hazptr/debug.h>
#include <folly/experimental/hazptr/hazptr.h>

#include <gflags/gflags.h>
#include <folly/portability/GTest.h>

#include <thread>

DEFINE_int32(num_threads, 1, "Number of threads");
DEFINE_int64(num_reps, 1, "Number of test reps");
DEFINE_int64(num_ops, 10, "Number of ops or pairs of ops per rep");

using namespace folly::hazptr;

class HazptrTest : public testing::Test {
 public:
  HazptrTest() : Test() {
    DEBUG_PRINT("========== start of test scope");
  }
  ~HazptrTest() override {
    DEBUG_PRINT("========== end of test scope");
  }
};

TEST_F(HazptrTest, Test1) {
  DEBUG_PRINT("");
  Node1* node0 = (Node1*)malloc(sizeof(Node1));
  DEBUG_PRINT("=== new    node0 " << node0 << " " << sizeof(*node0));
  Node1* node1 = (Node1*)malloc(sizeof(Node1));
  DEBUG_PRINT("=== malloc node1 " << node1 << " " << sizeof(*node1));
  Node1* node2 = (Node1*)malloc(sizeof(Node1));
  DEBUG_PRINT("=== malloc node2 " << node2 << " " << sizeof(*node2));
  Node1* node3 = (Node1*)malloc(sizeof(Node1));
  DEBUG_PRINT("=== malloc node3 " << node3 << " " << sizeof(*node3));

  DEBUG_PRINT("");

  std::atomic<Node1*> shared0 = {node0};
  std::atomic<Node1*> shared1 = {node1};
  std::atomic<Node1*> shared2 = {node2};
  std::atomic<Node1*> shared3 = {node3};

  MyMemoryResource myMr;
  DEBUG_PRINT("=== myMr " << &myMr);
  hazptr_domain myDomain0;
  DEBUG_PRINT("=== myDomain0 " << &myDomain0);
  hazptr_domain myDomain1(&myMr);
  DEBUG_PRINT("=== myDomain1 " << &myDomain1);

  DEBUG_PRINT("");

  DEBUG_PRINT("=== hptr0");
  hazptr_owner<Node1> hptr0;
  DEBUG_PRINT("=== hptr1");
  hazptr_owner<Node1> hptr1(myDomain0);
  DEBUG_PRINT("=== hptr2");
  hazptr_owner<Node1> hptr2(myDomain1);
  DEBUG_PRINT("=== hptr3");
  hazptr_owner<Node1> hptr3;

  DEBUG_PRINT("");

  Node1* n0 = shared0.load();
  Node1* n1 = shared1.load();
  Node1* n2 = shared2.load();
  Node1* n3 = shared3.load();

  if (hptr0.try_protect(n0, shared0)) {}
  if (hptr1.try_protect(n1, shared1)) {}
  hptr1.clear();
  hptr1.set(n2);
  if (hptr2.try_protect(n3, shared3)) {}
  swap(hptr1, hptr2);
  hptr3.clear();

  DEBUG_PRINT("");

  DEBUG_PRINT("=== retire n0 " << n0);
  n0->retire();
  DEBUG_PRINT("=== retire n1 " << n1);
  n1->retire(default_hazptr_domain());
  DEBUG_PRINT("=== retire n2 " << n2);
  n2->retire(myDomain0);
  DEBUG_PRINT("=== retire n3 " << n3);
  n3->retire(myDomain1);
}

TEST_F(HazptrTest, Test2) {
  Node2* node0 = new Node2;
  DEBUG_PRINT("=== new    node0 " << node0 << " " << sizeof(*node0));
  Node2* node1 = (Node2*)malloc(sizeof(Node2));
  DEBUG_PRINT("=== malloc node1 " << node1 << " " << sizeof(*node1));
  Node2* node2 = (Node2*)malloc(sizeof(Node2));
  DEBUG_PRINT("=== malloc node2 " << node2 << " " << sizeof(*node2));
  Node2* node3 = (Node2*)malloc(sizeof(Node2));
  DEBUG_PRINT("=== malloc node3 " << node3 << " " << sizeof(*node3));

  DEBUG_PRINT("");

  std::atomic<Node2*> shared0 = {node0};
  std::atomic<Node2*> shared1 = {node1};
  std::atomic<Node2*> shared2 = {node2};
  std::atomic<Node2*> shared3 = {node3};

  MineMemoryResource mineMr;
  DEBUG_PRINT("=== mineMr " << &mineMr);
  hazptr_domain mineDomain0;
  DEBUG_PRINT("=== mineDomain0 " << &mineDomain0);
  hazptr_domain mineDomain1(&mineMr);
  DEBUG_PRINT("=== mineDomain1 " << &mineDomain1);

  DEBUG_PRINT("");

  DEBUG_PRINT("=== hptr0");
  hazptr_owner<Node2> hptr0;
  DEBUG_PRINT("=== hptr1");
  hazptr_owner<Node2> hptr1(mineDomain0);
  DEBUG_PRINT("=== hptr2");
  hazptr_owner<Node2> hptr2(mineDomain1);
  DEBUG_PRINT("=== hptr3");
  hazptr_owner<Node2> hptr3;

  DEBUG_PRINT("");

  Node2* n0 = shared0.load();
  Node2* n1 = shared1.load();
  Node2* n2 = shared2.load();
  Node2* n3 = shared3.load();

  if (hptr0.try_protect(n0, shared0)) {}
  if (hptr1.try_protect(n1, shared1)) {}
  hptr1.clear();
  hptr1.set(n2);
  if (hptr2.try_protect(n3, shared3)) {}
  swap(hptr1, hptr2);
  hptr3.clear();

  DEBUG_PRINT("");

  DEBUG_PRINT("=== retire n0 " << n0);
  n0->retire(default_hazptr_domain(), &mineReclaimFnDelete);
  DEBUG_PRINT("=== retire n1 " << n1);
  n1->retire(default_hazptr_domain(), &mineReclaimFnFree);
  DEBUG_PRINT("=== retire n2 " << n2);
  n2->retire(mineDomain0, &mineReclaimFnFree);
  DEBUG_PRINT("=== retire n3 " << n3);
  n3->retire(mineDomain1, &mineReclaimFnFree);
}

TEST_F(HazptrTest, LIFO) {
  using T = uint32_t;
  CHECK_GT(FLAGS_num_threads, 0);
  for (int i = 0; i < FLAGS_num_reps; ++i) {
    DEBUG_PRINT("========== start of rep scope");
    LockFreeLIFO<T> s;
    std::vector<std::thread> threads(FLAGS_num_threads);
    for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
      threads[tid] = std::thread([&s, tid]() {
        for (int j = tid; j < FLAGS_num_ops; j += FLAGS_num_threads) {
          s.push(j);
          T res;
          while (!s.pop(res)) {}
        }
      });
    }
    for (auto& t : threads) {
      t.join();
    }
    DEBUG_PRINT("========== end of rep scope");
  }
}

TEST_F(HazptrTest, SWMRLIST) {
  using T = uint64_t;
  hazptr_domain custom_domain;

  CHECK_GT(FLAGS_num_threads, 0);
  for (int i = 0; i < FLAGS_num_reps; ++i) {
    DEBUG_PRINT("========== start of rep scope");
    SWMRListSet<T> s(custom_domain);
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
    DEBUG_PRINT("========== end of rep scope");
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
