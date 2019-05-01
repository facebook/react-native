/*
 * Copyright 2015-present Facebook, Inc.
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
#include <folly/experimental/FutureDAG.h>
#include <boost/thread/barrier.hpp>
#include <folly/portability/GTest.h>

using namespace folly;

struct FutureDAGTest : public testing::Test {
  typedef FutureDAG::Handle Handle;

  Handle add() {
    auto node = std::make_unique<TestNode>(this);
    auto handle = node->handle;
    nodes.emplace(handle, std::move(node));
    return handle;
  }

  void reset() {
    Handle source_node;
    std::unordered_set<Handle> memo;
    for (auto& node : nodes) {
      for (Handle handle : node.second->dependencies) {
        memo.insert(handle);
      }
    }
    for (auto& node : nodes) {
      if (memo.find(node.first) == memo.end()) {
        source_node = node.first;
      }
    }
    for (auto it = nodes.cbegin(); it != nodes.cend();) {
      if (it->first != source_node) {
        it = nodes.erase(it);
      } else {
        ++it;
      }
    }
    dag->reset();
  }

  void remove(Handle a) {
    for (auto& node : nodes) {
      node.second->dependencies.erase(a);
    }
    nodes.erase(a);
    dag->remove(a);
  }

  void dependency(Handle a, Handle b) {
    nodes.at(b)->dependencies.insert(a);
    dag->dependency(a, b);
  }

  void checkOrder() {
    EXPECT_EQ(nodes.size(), order.size());
    for (auto& kv : nodes) {
      auto handle = kv.first;
      auto& node = kv.second;
      auto it = order.begin();
      while (*it != handle) {
        it++;
      }
      for (auto dep : node->dependencies) {
        EXPECT_TRUE(std::find(it, order.end(), dep) == order.end());
      }
    }
  }

  struct TestNode {
    explicit TestNode(FutureDAGTest* test)
        : func([this, test] {
            test->order.push_back(handle);
            return Future<Unit>();
          }),
          handle(test->dag->add(func)) {}

    const FutureDAG::FutureFunc func;
    const Handle handle;
    std::set<Handle> dependencies;
  };

  const std::shared_ptr<FutureDAG> dag = FutureDAG::create();
  std::map<Handle, std::unique_ptr<TestNode>> nodes;
  std::vector<Handle> order;
};

TEST_F(FutureDAGTest, SingleNode) {
  add();
  ASSERT_NO_THROW(dag->go().get());
  checkOrder();
}

TEST_F(FutureDAGTest, RemoveSingleNode) {
  auto h1 = add();
  auto h2 = add();
  (void)h1;
  remove(h2);
  ASSERT_NO_THROW(dag->go().get());
  checkOrder();
}

TEST_F(FutureDAGTest, RemoveNodeComplex) {
  auto h1 = add();
  auto h2 = add();
  auto h3 = add();
  dependency(h1, h3);
  dependency(h2, h1);
  remove(h3);
  remove(h2);
  remove(h1);
  ASSERT_NO_THROW(dag->go().get());
  checkOrder();
}

TEST_F(FutureDAGTest, ResetDAG) {
  auto h1 = add();
  auto h2 = add();
  auto h3 = add();
  dependency(h3, h1);
  dependency(h2, h3);

  reset();
  ASSERT_NO_THROW(dag->go().get());
  checkOrder();
}

TEST_F(FutureDAGTest, FanOut) {
  auto h1 = add();
  auto h2 = add();
  auto h3 = add();
  dependency(h1, h2);
  dependency(h1, h3);
  ASSERT_NO_THROW(dag->go().get());
  checkOrder();
}

TEST_F(FutureDAGTest, FanIn) {
  auto h1 = add();
  auto h2 = add();
  auto h3 = add();
  dependency(h1, h3);
  dependency(h2, h3);
  ASSERT_NO_THROW(dag->go().get());
  checkOrder();
}

TEST_F(FutureDAGTest, FanOutFanIn) {
  auto h1 = add();
  auto h2 = add();
  auto h3 = add();
  auto h4 = add();
  dependency(h1, h3);
  dependency(h1, h2);
  dependency(h2, h4);
  dependency(h3, h4);
  ASSERT_NO_THROW(dag->go().get());
  checkOrder();
}

TEST_F(FutureDAGTest, Complex) {
  auto A = add();
  auto B = add();
  auto C = add();
  auto D = add();
  auto E = add();
  auto F = add();
  auto G = add();
  auto H = add();
  auto I = add();
  auto J = add();
  auto K = add();
  auto L = add();
  auto M = add();
  auto N = add();

  dependency(A, B);
  dependency(A, C);
  dependency(A, D);
  dependency(A, J);
  dependency(C, H);
  dependency(D, E);
  dependency(E, F);
  dependency(E, G);
  dependency(F, H);
  dependency(G, H);
  dependency(H, I);
  dependency(J, K);
  dependency(K, L);
  dependency(K, M);
  dependency(L, N);
  dependency(I, N);

  ASSERT_NO_THROW(dag->go().get());
  checkOrder();
}

FutureDAG::FutureFunc makeFutureFunc = [] { return makeFuture(); };

FutureDAG::FutureFunc throwFunc = [] {
  return makeFuture<Unit>(std::runtime_error("oops"));
};

TEST_F(FutureDAGTest, ThrowBegin) {
  auto h1 = dag->add(throwFunc);
  auto h2 = dag->add(makeFutureFunc);
  dag->dependency(h1, h2);
  EXPECT_THROW(dag->go().get(), std::runtime_error);
}

TEST_F(FutureDAGTest, ThrowEnd) {
  auto h1 = dag->add(makeFutureFunc);
  auto h2 = dag->add(throwFunc);
  dag->dependency(h1, h2);
  EXPECT_THROW(dag->go().get(), std::runtime_error);
}

TEST_F(FutureDAGTest, Cycle1) {
  auto h1 = add();
  dependency(h1, h1);
  EXPECT_THROW(dag->go().get(), std::runtime_error);
}

TEST_F(FutureDAGTest, Cycle2) {
  auto h1 = add();
  auto h2 = add();
  dependency(h1, h2);
  dependency(h2, h1);
  EXPECT_THROW(dag->go().get(), std::runtime_error);
}

TEST_F(FutureDAGTest, Cycle3) {
  auto h1 = add();
  auto h2 = add();
  auto h3 = add();
  dependency(h1, h2);
  dependency(h2, h3);
  dependency(h3, h1);
  EXPECT_THROW(dag->go().get(), std::runtime_error);
}

TEST_F(FutureDAGTest, DestroyBeforeComplete) {
  auto barrier = std::make_shared<boost::barrier>(2);
  Future<Unit> f;
  {
    auto localDag = FutureDAG::create();
    auto h1 = localDag->add([barrier] {
      auto p = std::make_shared<Promise<Unit>>();
      std::thread t([p, barrier] {
        barrier->wait();
        p->setValue();
      });
      t.detach();
      return p->getFuture();
    });
    auto h2 = localDag->add(makeFutureFunc);
    localDag->dependency(h1, h2);
    f = localDag->go();
  }
  barrier->wait();
  ASSERT_NO_THROW(std::move(f).get());
}
