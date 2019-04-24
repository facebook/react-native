/*
 * Copyright 2014-present Facebook, Inc.
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
#include <iostream>
#include <queue>

#include <folly/Memory.h>

#include <folly/fibers/FiberManager.h>
#include <folly/fibers/SimpleLoopController.h>

using namespace folly::fibers;

struct Application {
 public:
  Application()
      : fiberManager(std::make_unique<SimpleLoopController>()),
        toSend(20),
        maxOutstanding(5) {}

  void loop() {
    if (pendingRequests.size() == maxOutstanding || toSend == 0) {
      if (pendingRequests.empty()) {
        return;
      }
      intptr_t value = rand() % 1000;
      std::cout << "Completing request with data = " << value << std::endl;

      pendingRequests.front().setValue(value);
      pendingRequests.pop();
    } else {
      static size_t id_counter = 1;
      size_t id = id_counter++;
      std::cout << "Adding new request with id = " << id << std::endl;

      fiberManager.addTask([this, id]() {
        std::cout << "Executing fiber with id = " << id << std::endl;

        auto result1 = await([this](Promise<int> fiber) {
          pendingRequests.push(std::move(fiber));
        });

        std::cout << "Fiber id = " << id << " got result1 = " << result1
                  << std::endl;

        auto result2 = await([this](Promise<int> fiber) {
          pendingRequests.push(std::move(fiber));
        });
        std::cout << "Fiber id = " << id << " got result2 = " << result2
                  << std::endl;
      });

      if (--toSend == 0) {
        auto& loopController =
            dynamic_cast<SimpleLoopController&>(fiberManager.loopController());
        loopController.stop();
      }
    }
  }

  FiberManager fiberManager;

  std::queue<Promise<int>> pendingRequests;
  size_t toSend;
  size_t maxOutstanding;
};

int main() {
  Application app;

  auto loop = [&app]() { app.loop(); };

  auto& loopController =
      dynamic_cast<SimpleLoopController&>(app.fiberManager.loopController());

  loopController.loop(std::move(loop));

  return 0;
}
