#include <gtest/gtest.h>

#include <cxxreact/CxxMessageQueue.h>

#include <mutex>
#include <condition_variable>

using namespace facebook::react;
using detail::EventFlag;
using time_point = EventFlag::time_point;

using std::chrono::milliseconds;

namespace {
time_point now() {
  return std::chrono::steady_clock::now();
}

std::shared_ptr<CxxMessageQueue> createAndStartQueue(EventFlag& finishedFlag) {
  auto q = std::make_shared<CxxMessageQueue>();
  std::thread t([q, &finishedFlag] () mutable {
      auto loop = CxxMessageQueue::getRunLoop(q);
      // Note: make sure that no stack frames above loop() have a strong reference to q.
      q.reset();
      loop();
      finishedFlag.set();
    });
  t.detach();
  return q;
}

// This is just used to start up a queue for a test and make sure that it is
// actually shut down after the test.
struct QueueWithThread {
  QueueWithThread() {
    queue = createAndStartQueue(done);
  }

  ~QueueWithThread() {
    queue->quitSynchronous();
    queue.reset();
    if (!done.wait_until(now() + milliseconds(300))) {
      ADD_FAILURE() << "Queue did not exit";
    }
  }

  EventFlag done;
  std::shared_ptr<CxxMessageQueue> queue;
};
}

TEST(CxxMessageQueue, TestQuit) {
  EventFlag done;
  auto q = createAndStartQueue(done);
  q->quitSynchronous();
  if (!done.wait_until(now() + milliseconds(300))) {
    FAIL() << "Queue did not exit runloop after quitSynchronous";
  }
}

TEST(CxxMessageQueue, TestPostTask) {
  QueueWithThread qt;
  auto q = qt.queue;

  EventFlag flag;
  q->runOnQueue([&] {
      flag.set();
    });
  flag.wait();
}

TEST(CxxMessageQueue, TestPostTaskMultiple) {
  QueueWithThread qt;
  auto q = qt.queue;

  std::vector<EventFlag> vec(10);
  for (int i = 0; i < 10; i++) {
    q->runOnQueue([&, i] {
        vec[i].set();
      });
  }
  for (int i = 0; i < 10; i++) {
    vec[i].wait();
  }
}

TEST(CxxMessageQueue, TestQueuedTaskOrdering) {
  QueueWithThread qt;
  auto q = qt.queue;

  // Block the runloop so we can get some queued tasks.
  EventFlag wait;
  q->runOnQueue([&] {
      wait.wait();
    });

  // These tasks should run in order.
  int failed = -1;
  int i = 0;
  for (int j = 0; j < 10; j++) {
    q->runOnQueue([&, j] {
        if (i != j) {
          failed = j;
        }
        i++;
      });
  }
  wait.set();

  // Flush the queue.
  q->runOnQueueSync([&] {});

  ASSERT_EQ(failed, -1);
  ASSERT_EQ(i, 10);
}

TEST(CxxMessageQueue, TestDelayedTaskOrdering) {
  QueueWithThread qt;
  auto q = qt.queue;

  // Block the runloop so we can get some queued tasks.
  EventFlag wait;
  q->runOnQueue([&] {
      wait.wait();
    });

  int ids[] = {8, 4, 6, 1, 3, 2, 9, 5, 0, 7};

  int failed = -1;
  int i = 0;
  EventFlag done;
  // If this loop actually takes longer than the difference between delays, the
  // ordering could get screwed up :/
  for (int j = 0; j < 10; j++) {
    q->runOnQueueDelayed([&, j] {
        if (i != ids[j]) {
          failed = j;
        }
        i++;
        if (ids[j] == 9) {
          done.set();
        }
      }, 50 + 10 * ids[j]);
  }
  wait.set();
  done.wait();

  ASSERT_EQ(failed, -1);
  ASSERT_EQ(i, 10);
}
