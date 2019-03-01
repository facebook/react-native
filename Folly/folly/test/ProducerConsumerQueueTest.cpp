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

#include <folly/ProducerConsumerQueue.h>

#include <atomic>
#include <chrono>
#include <memory>
#include <thread>
#include <vector>

#include <glog/logging.h>

#include <folly/portability/GTest.h>

//////////////////////////////////////////////////////////////////////

namespace {

template<class T> struct TestTraits {
  T limit() const { return 1 << 24; }
  T generate() const { return rand() % 26; }
};

template<> struct TestTraits<std::string> {
  unsigned int limit() const { return 1 << 22; }
  std::string generate() const { return std::string(12, ' '); }
};

template<class QueueType, size_t Size, bool Pop = false>
struct PerfTest {
  typedef typename QueueType::value_type T;

  explicit PerfTest() : queue_(Size), done_(false) {}

  void operator()() {
    using namespace std::chrono;
    auto const startTime = system_clock::now();

    std::thread producer([this] { this->producer(); });
    std::thread consumer([this] { this->consumer(); });

    producer.join();
    done_ = true;
    consumer.join();

    auto duration = duration_cast<milliseconds>(
      system_clock::now() - startTime);
    LOG(INFO) << "     done: " << duration.count() << "ms";
  }

  void producer() {
    // This is written differently than you might expect so that
    // it does not run afoul of -Wsign-compare, regardless of the
    // signedness of this loop's upper bound.
    for (auto i = traits_.limit(); i > 0; --i) {
      while (!queue_.write(traits_.generate())) {
      }
    }
  }

  void consumer() {
    /*static*/ if (Pop) {
      while (!done_) {
        if (queue_.frontPtr()) {
          queue_.popFront();
        }
      }
    } else {
      while (!done_) {
        T data;
        queue_.read(data);
      }
    }
  }

  QueueType queue_;
  std::atomic<bool> done_;
  TestTraits<T> traits_;
};

template<class TestType> void doTest(const char* name) {
  LOG(INFO) << "  testing: " << name;
  std::unique_ptr<TestType> const t(new TestType());
  (*t)();
}

template<class T, bool Pop = false>
void perfTestType(const char* type) {
  const size_t size = 0xfffe;

  LOG(INFO) << "Type: " << type;
  doTest<PerfTest<folly::ProducerConsumerQueue<T>,size,Pop> >(
    "ProducerConsumerQueue");
}

template<class QueueType, size_t Size, bool Pop>
struct CorrectnessTest {
  typedef typename QueueType::value_type T;

  explicit CorrectnessTest()
    : queue_(Size)
    , done_(false)
  {
    const size_t testSize = traits_.limit();
    testData_.reserve(testSize);
    for (size_t i = 0; i < testSize; ++i) {
      testData_.push_back(traits_.generate());
    }
  }

  void operator()() {
    std::thread producer([this] { this->producer(); });
    std::thread consumer([this] { this->consumer(); });

    producer.join();
    done_ = true;
    consumer.join();
  }

  void producer() {
    for (auto& data : testData_) {
      while (!queue_.write(data)) {
      }
    }
  }

  void consumer() {
    if (Pop) {
      consumerPop();
    } else {
      consumerRead();
    }
  }

  void consumerPop() {
    for (auto expect : testData_) {
    again:
      T* data;
      if (!(data = queue_.frontPtr())) {
        if (done_) {
          // Try one more read; unless there's a bug in the queue class
          // there should still be more data sitting in the queue even
          // though the producer thread exited.
          if (!(data = queue_.frontPtr())) {
            EXPECT_TRUE(0 && "Finished too early ...");
            return;
          }
        } else {
          goto again;
        }
        EXPECT_EQ(*data, expect);
      } else {
        EXPECT_EQ(*data, expect);
        queue_.popFront();
      }
    }
  }

  void consumerRead() {
    for (auto expect : testData_) {
    again:
      T data;
      if (!queue_.read(data)) {
        if (done_) {
          // Try one more read; unless there's a bug in the queue class
          // there should still be more data sitting in the queue even
          // though the producer thread exited.
          if (!queue_.read(data)) {
            EXPECT_TRUE(0 && "Finished too early ...");
            return;
          }
        } else {
          goto again;
        }
      }
      EXPECT_EQ(data, expect);
    }
  }

  std::vector<T> testData_;
  QueueType queue_;
  TestTraits<T> traits_;
  std::atomic<bool> done_;
};

template<class T, bool Pop = false>
void correctnessTestType(const std::string& type) {
  LOG(INFO) << "Type: " << type;
  doTest<CorrectnessTest<folly::ProducerConsumerQueue<T>,0xfffe,Pop> >(
    "ProducerConsumerQueue");
}

struct DtorChecker {
  static unsigned int numInstances;
  DtorChecker() { ++numInstances; }
  DtorChecker(const DtorChecker& /* o */) { ++numInstances; }
  ~DtorChecker() { --numInstances; }
};

unsigned int DtorChecker::numInstances = 0;

}

//////////////////////////////////////////////////////////////////////

TEST(PCQ, QueueCorrectness) {
  correctnessTestType<std::string,true>("string (front+pop)");
  correctnessTestType<std::string>("string");
  correctnessTestType<int>("int");
  correctnessTestType<unsigned long long>("unsigned long long");
}

TEST(PCQ, PerfTest) {
  perfTestType<std::string,true>("string (front+pop)");
  perfTestType<std::string>("string");
  perfTestType<int>("int");
  perfTestType<unsigned long long>("unsigned long long");
}

TEST(PCQ, Destructor) {
  // Test that orphaned elements in a ProducerConsumerQueue are
  // destroyed.
  {
    folly::ProducerConsumerQueue<DtorChecker> queue(1024);
    for (int i = 0; i < 10; ++i) {
      EXPECT_TRUE(queue.write(DtorChecker()));
    }

    EXPECT_EQ(DtorChecker::numInstances, 10);

    {
      DtorChecker ignore;
      EXPECT_TRUE(queue.read(ignore));
      EXPECT_TRUE(queue.read(ignore));
    }

    EXPECT_EQ(DtorChecker::numInstances, 8);
  }

  EXPECT_EQ(DtorChecker::numInstances, 0);

  // Test the same thing in the case that the queue write pointer has
  // wrapped, but the read one hasn't.
  {
    folly::ProducerConsumerQueue<DtorChecker> queue(4);
    for (int i = 0; i < 3; ++i) {
      EXPECT_TRUE(queue.write(DtorChecker()));
    }
    EXPECT_EQ(DtorChecker::numInstances, 3);
    {
      DtorChecker ignore;
      EXPECT_TRUE(queue.read(ignore));
    }
    EXPECT_EQ(DtorChecker::numInstances, 2);
    EXPECT_TRUE(queue.write(DtorChecker()));
    EXPECT_EQ(DtorChecker::numInstances, 3);
  }
  EXPECT_EQ(DtorChecker::numInstances, 0);
}

TEST(PCQ, EmptyFull) {
  folly::ProducerConsumerQueue<int> queue(3);
  EXPECT_TRUE(queue.isEmpty());
  EXPECT_FALSE(queue.isFull());

  EXPECT_TRUE(queue.write(1));
  EXPECT_FALSE(queue.isEmpty());
  EXPECT_FALSE(queue.isFull());

  EXPECT_TRUE(queue.write(2));
  EXPECT_FALSE(queue.isEmpty());
  EXPECT_TRUE(queue.isFull());  // Tricky: full after 2 writes, not 3.

  EXPECT_FALSE(queue.write(3));
  EXPECT_EQ(queue.sizeGuess(), 2);
}
