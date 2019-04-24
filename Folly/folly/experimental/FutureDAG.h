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
#pragma once

#include <folly/futures/Future.h>
#include <folly/futures/SharedPromise.h>

namespace folly {

class FutureDAG : public std::enable_shared_from_this<FutureDAG> {
 public:
  static std::shared_ptr<FutureDAG> create() {
    return std::shared_ptr<FutureDAG>(new FutureDAG());
  }

  typedef size_t Handle;
  typedef std::function<Future<Unit>()> FutureFunc;

  Handle add(FutureFunc func, Executor* executor = nullptr) {
    nodes.emplace_back(std::move(func), executor);
    return nodes.size() - 1;
  }

  void remove(Handle a) {
    if (a >= nodes.size()) {
      return;
    }

    if (nodes[a].hasDependents) {
      for (auto& node : nodes) {
        auto& deps = node.dependencies;
        deps.erase(
            std::remove(std::begin(deps), std::end(deps), a), std::end(deps));
        for (Handle& handle : deps) {
          if (handle > a) {
            handle--;
          }
        }
      }
    }

    nodes.erase(nodes.begin() + a);
  }

  void reset() {
    // Delete all but source node, and reset dependency properties
    Handle source_node;
    std::unordered_set<Handle> memo;
    for (auto& node : nodes) {
      for (Handle handle : node.dependencies) {
        memo.insert(handle);
      }
    }
    for (Handle handle = 0; handle < nodes.size(); handle++) {
      if (memo.find(handle) == memo.end()) {
        source_node = handle;
      }
    }

    nodes.erase(nodes.begin(), nodes.begin() + source_node);
    nodes.erase(nodes.begin() + 1, nodes.end());
    nodes[0].hasDependents = false;
    nodes[0].dependencies.clear();
  }

  void dependency(Handle a, Handle b) {
    nodes[b].dependencies.push_back(a);
    nodes[a].hasDependents = true;
  }

  void clean_state(Handle source, Handle sink) {
    for (auto handle : nodes[sink].dependencies) {
      nodes[handle].hasDependents = false;
    }
    nodes[0].hasDependents = false;
    remove(source);
    remove(sink);
  }

  Future<Unit> go() {
    if (hasCycle()) {
      return makeFuture<Unit>(std::runtime_error("Cycle in FutureDAG graph"));
    }
    std::vector<Handle> rootNodes;
    std::vector<Handle> leafNodes;
    for (Handle handle = 0; handle < nodes.size(); handle++) {
      if (nodes[handle].dependencies.empty()) {
        rootNodes.push_back(handle);
      }
      if (!nodes[handle].hasDependents) {
        leafNodes.push_back(handle);
      }
    }

    auto sinkHandle = add([] { return Future<Unit>(); });
    for (auto handle : leafNodes) {
      dependency(handle, sinkHandle);
    }

    auto sourceHandle = add(nullptr);
    for (auto handle : rootNodes) {
      dependency(sourceHandle, handle);
    }

    for (Handle handle = 0; handle < nodes.size() - 1; handle++) {
      std::vector<Future<Unit>> dependencies;
      for (auto depHandle : nodes[handle].dependencies) {
        dependencies.push_back(nodes[depHandle].promise.getFuture());
      }

      collect(dependencies)
          .via(nodes[handle].executor)
          .thenValue([this, handle](std::vector<Unit>&&) {
            nodes[handle].func().then([this, handle](Try<Unit>&& t) {
              nodes[handle].promise.setTry(std::move(t));
            });
          })
          .onError([this, handle](exception_wrapper ew) {
            nodes[handle].promise.setException(std::move(ew));
          });
    }

    nodes[sourceHandle].promise.setValue();
    return nodes[sinkHandle].promise.getFuture().thenValue(
        [that = shared_from_this(), sourceHandle, sinkHandle](Unit) {
          that->clean_state(sourceHandle, sinkHandle);
        });
  }

 private:
  FutureDAG() = default;

  bool hasCycle() {
    // Perform a modified topological sort to detect cycles
    std::vector<std::vector<Handle>> dependencies;
    for (auto& node : nodes) {
      dependencies.push_back(node.dependencies);
    }

    std::vector<size_t> dependents(nodes.size());
    for (auto& dependencyEdges : dependencies) {
      for (auto handle : dependencyEdges) {
        dependents[handle]++;
      }
    }

    std::vector<Handle> handles;
    for (Handle handle = 0; handle < nodes.size(); handle++) {
      if (!nodes[handle].hasDependents) {
        handles.push_back(handle);
      }
    }

    while (!handles.empty()) {
      auto handle = handles.back();
      handles.pop_back();
      while (!dependencies[handle].empty()) {
        auto dependency = dependencies[handle].back();
        dependencies[handle].pop_back();
        if (--dependents[dependency] == 0) {
          handles.push_back(dependency);
        }
      }
    }

    for (auto& dependencyEdges : dependencies) {
      if (!dependencyEdges.empty()) {
        return true;
      }
    }

    return false;
  }

  struct Node {
    Node(FutureFunc&& funcArg, Executor* executorArg)
        : func(std::move(funcArg)), executor(executorArg) {}

    FutureFunc func{nullptr};
    Executor* executor{nullptr};
    SharedPromise<Unit> promise;
    std::vector<Handle> dependencies;
    bool hasDependents{false};
    bool visited{false};
  };

  std::vector<Node> nodes;
};

// Polymorphic functor implementation
template <typename T>
class FutureDAGFunctor {
 public:
  std::shared_ptr<FutureDAG> dag = FutureDAG::create();
  T state;
  std::vector<T> dep_states;
  T result() {
    return state;
  }
  // execReset() runs DAG & clears all nodes except for source
  void execReset() {
    this->dag->go().get();
    this->dag->reset();
  }
  void exec() {
    this->dag->go().get();
  }
  virtual void operator()() {}
  explicit FutureDAGFunctor(T init_val) : state(init_val) {}
  FutureDAGFunctor() : state() {}
  virtual ~FutureDAGFunctor() {}
};

} // namespace folly
