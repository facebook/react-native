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

#include <folly/io/async/NotificationQueue.h>

#include <sys/types.h>

#include <iostream>
#include <list>
#include <thread>

#include <folly/io/async/ScopedEventBaseThread.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

#ifndef _WIN32
#include <sys/wait.h>
#endif

using namespace std;
using namespace folly;

typedef NotificationQueue<int> IntQueue;

class QueueConsumer : public IntQueue::Consumer {
 public:
  QueueConsumer() {}

  void messageAvailable(int&& value) noexcept override {
    messages.push_back(value);
    if (fn) {
      fn(value);
    }
  }

  std::function<void(int)> fn;
  std::deque<int> messages;
};

class QueueTest {
 public:
  explicit QueueTest(uint32_t maxSize, IntQueue::FdType type)
      : queue(maxSize, type), terminationQueue(maxSize, type) {}

  void sendOne();
  void putMessages();
  void multiConsumer();
  void maxQueueSize();
  void maxReadAtOnce();
  void destroyCallback();
  void useAfterFork();

  IntQueue queue;
  IntQueue terminationQueue;
};

void QueueTest::sendOne() {
  // Create a notification queue and a callback in this thread
  EventBase eventBase;

  QueueConsumer consumer;
  consumer.fn = [&](int) {
    // Stop consuming after we receive 1 message
    consumer.stopConsuming();
  };
  consumer.startConsuming(&eventBase, &queue);

  // Start a new EventBase thread to put a message on our queue
  ScopedEventBaseThread t1;
  t1.getEventBase()->runInEventBaseThread([&] { this->queue.putMessage(5); });

  // Loop until we receive the message
  eventBase.loop();

  const auto& messages = consumer.messages;
  EXPECT_EQ(1, messages.size());
  EXPECT_EQ(5, messages.at(0));
}

void QueueTest::putMessages() {
  EventBase eventBase;

  QueueConsumer consumer;
  QueueConsumer consumer2;
  consumer.fn = [&](int msg) {
    // Stop consuming after we receive a message with value 0, and start
    // consumer2
    if (msg == 0) {
      consumer.stopConsuming();
      consumer2.startConsuming(&eventBase, &queue);
    }
  };
  consumer2.fn = [&](int msg) {
    // Stop consuming after we receive a message with value 0
    if (msg == 0) {
      consumer2.stopConsuming();
    }
  };
  consumer.startConsuming(&eventBase, &queue);

  list<int> msgList = {1, 2, 3, 4};
  vector<int> msgVector = {5, 0, 9, 8, 7, 6, 7, 7, 8, 8, 2, 9, 6, 6, 10, 2, 0};
  // Call putMessages() several times to add messages to the queue
  queue.putMessages(msgList.begin(), msgList.end());
  queue.putMessages(msgVector.begin() + 2, msgVector.begin() + 4);
  // Test sending 17 messages, the pipe-based queue calls write in 16 byte
  // chunks
  queue.putMessages(msgVector.begin(), msgVector.end());

  // Loop until the consumer has stopped
  eventBase.loop();

  vector<int> expectedMessages = {1, 2, 3, 4, 9, 8, 7, 5, 0};
  vector<int> expectedMessages2 = {9, 8, 7, 6, 7, 7, 8, 8, 2, 9, 6, 10, 2, 0};
  EXPECT_EQ(expectedMessages.size(), consumer.messages.size());
  for (unsigned int idx = 0; idx < expectedMessages.size(); ++idx) {
    EXPECT_EQ(expectedMessages[idx], consumer.messages.at(idx));
  }
  EXPECT_EQ(expectedMessages2.size(), consumer2.messages.size());
  for (unsigned int idx = 0; idx < expectedMessages2.size(); ++idx) {
    EXPECT_EQ(expectedMessages2[idx], consumer2.messages.at(idx));
  }
}

void QueueTest::multiConsumer() {
  uint32_t numConsumers = 8;
  uint32_t numMessages = 10000;

  // Create several consumers each running in their own EventBase thread
  vector<QueueConsumer> consumers(numConsumers);
  vector<ScopedEventBaseThread> threads(numConsumers);

  for (uint32_t consumerIdx = 0; consumerIdx < numConsumers; ++consumerIdx) {
    QueueConsumer* consumer = &consumers[consumerIdx];

    consumer->fn = [consumer, consumerIdx, this](int value) {
      // Treat 0 as a signal to stop.
      if (value == 0) {
        consumer->stopConsuming();
        // Put a message on the terminationQueue to indicate we have stopped
        terminationQueue.putMessage(consumerIdx);
      }
    };

    EventBase* eventBase = threads[consumerIdx].getEventBase();
    eventBase->runInEventBaseThread([eventBase, consumer, this] {
      consumer->startConsuming(eventBase, &queue);
    });
  }

  // Now add a number of messages from this thread
  // Start at 1 rather than 0, since 0 is the signal to stop.
  for (uint32_t n = 1; n < numMessages; ++n) {
    queue.putMessage(n);
  }
  // Now add a 0 for each consumer, to signal them to stop
  for (uint32_t n = 0; n < numConsumers; ++n) {
    queue.putMessage(0);
  }

  // Wait until we get notified that all of the consumers have stopped
  // We use a separate notification queue for this.
  QueueConsumer terminationConsumer;
  vector<uint32_t> consumersStopped(numConsumers, 0);
  uint32_t consumersRemaining = numConsumers;
  terminationConsumer.fn = [&](int consumerIdx) {
    --consumersRemaining;
    if (consumersRemaining == 0) {
      terminationConsumer.stopConsuming();
    }

    EXPECT_GE(consumerIdx, 0);
    EXPECT_LT(consumerIdx, numConsumers);
    ++consumersStopped[consumerIdx];
  };
  EventBase eventBase;
  terminationConsumer.startConsuming(&eventBase, &terminationQueue);
  eventBase.loop();

  // Verify that we saw exactly 1 stop message for each consumer
  for (uint32_t n = 0; n < numConsumers; ++n) {
    EXPECT_EQ(1, consumersStopped[n]);
  }

  // Validate that every message sent to the main queue was received exactly
  // once.
  vector<int> messageCount(numMessages, 0);
  for (uint32_t n = 0; n < numConsumers; ++n) {
    for (int msg : consumers[n].messages) {
      EXPECT_GE(msg, 0);
      EXPECT_LT(msg, numMessages);
      ++messageCount[msg];
    }
  }

  // 0 is the signal to stop, and should have been received once by each
  // consumer
  EXPECT_EQ(numConsumers, messageCount[0]);
  // All other messages should have been received exactly once
  for (uint32_t n = 1; n < numMessages; ++n) {
    EXPECT_EQ(1, messageCount[n]);
  }
}

void QueueTest::maxQueueSize() {
  // Create a queue with a maximum size of 5, and fill it up

  for (int n = 0; n < 5; ++n) {
    queue.tryPutMessage(n);
  }

  // Calling tryPutMessage() now should fail
  EXPECT_THROW(queue.tryPutMessage(5), std::overflow_error);

  EXPECT_FALSE(queue.tryPutMessageNoThrow(5));
  int val = 5;
  EXPECT_FALSE(queue.tryPutMessageNoThrow(std::move(val)));

  // Pop a message from the queue
  int result = -1;
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(0, result);

  // We should be able to write another message now that we popped one off.
  queue.tryPutMessage(5);
  // But now we are full again.
  EXPECT_THROW(queue.tryPutMessage(6), std::overflow_error);
  // putMessage() should let us exceed the maximum
  queue.putMessage(6);

  // Pull another mesage off
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(1, result);

  // tryPutMessage() should still fail since putMessage() actually put us over
  // the max.
  EXPECT_THROW(queue.tryPutMessage(7), std::overflow_error);

  // Pull another message off and try again
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(2, result);
  queue.tryPutMessage(7);

  // Now pull all the remaining messages off
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(3, result);
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(4, result);
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(5, result);
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(6, result);
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(7, result);

  // There should be no messages left
  result = -1;
  EXPECT_TRUE(!queue.tryConsume(result));
  EXPECT_EQ(-1, result);
}

void QueueTest::maxReadAtOnce() {
  // Add 100 messages to the queue
  for (int n = 0; n < 100; ++n) {
    queue.putMessage(n);
  }

  EventBase eventBase;

  // Record how many messages were processed each loop iteration.
  uint32_t messagesThisLoop = 0;
  std::vector<uint32_t> messagesPerLoop;
  std::function<void()> loopFinished = [&] {
    // Record the current number of messages read this loop
    messagesPerLoop.push_back(messagesThisLoop);
    // Reset messagesThisLoop to 0 for the next loop
    messagesThisLoop = 0;

    // To prevent use-after-free bugs when eventBase destructs,
    // prevent calling runInLoop any more after the test is finished.
    // 55 == number of times loop should run.
    if (messagesPerLoop.size() != 55) {
      // Reschedule ourself to run at the end of the next loop
      eventBase.runInLoop(loopFinished);
    }
  };
  // Schedule the first call to loopFinished
  eventBase.runInLoop(loopFinished);

  QueueConsumer consumer;
  // Read the first 50 messages 10 at a time.
  consumer.setMaxReadAtOnce(10);
  consumer.fn = [&](int value) {
    ++messagesThisLoop;
    // After 50 messages, drop to reading only 1 message at a time.
    if (value == 50) {
      consumer.setMaxReadAtOnce(1);
    }
    // Terminate the loop when we reach the end of the messages.
    if (value == 99) {
      eventBase.terminateLoopSoon();
    }
  };
  consumer.startConsuming(&eventBase, &queue);

  // Run the event loop until the consumer terminates it
  eventBase.loop();

  // The consumer should have read all 100 messages in order
  EXPECT_EQ(100, consumer.messages.size());
  for (int n = 0; n < 100; ++n) {
    EXPECT_EQ(n, consumer.messages.at(n));
  }

  // Currently EventBase happens to still run the loop callbacks even after
  // terminateLoopSoon() is called.  However, we don't really want to depend on
  // this behavior.  In case this ever changes in the future, add
  // messagesThisLoop to messagesPerLoop in loop callback isn't invoked for the
  // last loop iteration.
  if (messagesThisLoop > 0) {
    messagesPerLoop.push_back(messagesThisLoop);
    messagesThisLoop = 0;
  }

  // For the first 5 loops it should have read 10 messages each time.
  // After that it should have read 1 messages per loop for the next 50 loops.
  EXPECT_EQ(55, messagesPerLoop.size());
  for (int n = 0; n < 5; ++n) {
    EXPECT_EQ(10, messagesPerLoop.at(n));
  }
  for (int n = 5; n < 55; ++n) {
    EXPECT_EQ(1, messagesPerLoop.at(n));
  }
}

void QueueTest::destroyCallback() {
  // Rather than using QueueConsumer, define a separate class for the destroy
  // test.  The DestroyTestConsumer will delete itself inside the
  // messageAvailable() callback.  With a regular QueueConsumer this would
  // destroy the std::function object while the function is running, which we
  // should probably avoid doing.  This uses a pointer to a std::function to
  // avoid destroying the function object.
  class DestroyTestConsumer : public IntQueue::Consumer {
   public:
    void messageAvailable(int&& value) noexcept override {
      DestructorGuard g(this);
      if (fn && *fn) {
        (*fn)(value);
      }
    }

    std::function<void(int)>* fn;

   protected:
    ~DestroyTestConsumer() override = default;
  };

  EventBase eventBase;
  // Create a queue and add 2 messages to it
  queue.putMessage(1);
  queue.putMessage(2);

  // Create two QueueConsumers allocated on the heap.
  // Have whichever one gets called first destroy both of the QueueConsumers.
  // This way one consumer will be destroyed from inside its messageAvailable()
  // callback, and one consume will be destroyed when it isn't inside
  // messageAvailable().
  std::unique_ptr<DestroyTestConsumer, DelayedDestruction::Destructor>
      consumer1(new DestroyTestConsumer);
  std::unique_ptr<DestroyTestConsumer, DelayedDestruction::Destructor>
      consumer2(new DestroyTestConsumer);
  std::function<void(int)> fn = [&](int) {
    consumer1 = nullptr;
    consumer2 = nullptr;
  };
  consumer1->fn = &fn;
  consumer2->fn = &fn;

  consumer1->startConsuming(&eventBase, &queue);
  consumer2->startConsuming(&eventBase, &queue);

  // Run the event loop.
  eventBase.loop();

  // One of the consumers should have fired, received the message,
  // then destroyed both consumers.
  EXPECT_TRUE(!consumer1);
  EXPECT_TRUE(!consumer2);
  // One message should be left in the queue
  int result = 1;
  EXPECT_TRUE(queue.tryConsume(result));
  EXPECT_EQ(2, result);
}

TEST(NotificationQueueTest, ConsumeUntilDrained) {
  // Basic tests: make sure we
  // - drain all the messages
  // - ignore any maxReadAtOnce
  // - can't add messages during draining
  EventBase eventBase;
  IntQueue queue;
  QueueConsumer consumer;
  consumer.fn = [&](int i) {
    EXPECT_THROW(queue.tryPutMessage(i), std::runtime_error);
    EXPECT_FALSE(queue.tryPutMessageNoThrow(i));
    EXPECT_THROW(queue.putMessage(i), std::runtime_error);
    std::vector<int> ints{1, 2, 3};
    EXPECT_THROW(
        queue.putMessages(ints.begin(), ints.end()), std::runtime_error);
  };
  consumer.setMaxReadAtOnce(10); // We should ignore this
  consumer.startConsuming(&eventBase, &queue);
  for (int i = 0; i < 20; i++) {
    queue.putMessage(i);
  }
  EXPECT_TRUE(consumer.consumeUntilDrained());
  EXPECT_EQ(20, consumer.messages.size());

  // Make sure there can only be one drainer at once
  folly::Baton<> callbackBaton, threadStartBaton;
  consumer.fn = [&](int /* i */) { callbackBaton.wait(); };
  QueueConsumer competingConsumer;
  competingConsumer.startConsuming(&eventBase, &queue);
  queue.putMessage(1);
  atomic<bool> raceA{false};
  atomic<bool> raceB{false};
  size_t numConsA = 0;
  size_t numConsB = 0;
  auto thread = std::thread([&] {
    threadStartBaton.post();
    raceB = consumer.consumeUntilDrained(&numConsB) && numConsB;
  });
  threadStartBaton.wait();
  raceA = competingConsumer.consumeUntilDrained(&numConsA) && numConsA;
  callbackBaton.post();
  thread.join();
  EXPECT_FALSE(raceA && raceB);
  EXPECT_TRUE(raceA || raceB);
  EXPECT_TRUE(raceA ^ raceB);
}

TEST(NotificationQueueTest, ConsumeUntilDrainedStress) {
  for (size_t i = 0; i < 1 << 8; ++i) {
    // Basic tests: make sure we
    // - drain all the messages
    // - ignore any maxReadAtOnce
    // - can't add messages during draining
    EventBase eventBase;
    IntQueue queue;
    QueueConsumer consumer;
    consumer.fn = [&](int j) {
      EXPECT_THROW(queue.tryPutMessage(j), std::runtime_error);
      EXPECT_FALSE(queue.tryPutMessageNoThrow(j));
      EXPECT_THROW(queue.putMessage(j), std::runtime_error);
      std::vector<int> ints{1, 2, 3};
      EXPECT_THROW(
          queue.putMessages(ints.begin(), ints.end()), std::runtime_error);
    };
    consumer.setMaxReadAtOnce(10); // We should ignore this
    consumer.startConsuming(&eventBase, &queue);
    for (int j = 0; j < 20; j++) {
      queue.putMessage(j);
    }
    EXPECT_TRUE(consumer.consumeUntilDrained());
    EXPECT_EQ(20, consumer.messages.size());

    // Make sure there can only be one drainer at once
    folly::Baton<> callbackBaton, threadStartBaton;
    consumer.fn = [&](int /* i */) { callbackBaton.wait(); };
    QueueConsumer competingConsumer;
    competingConsumer.startConsuming(&eventBase, &queue);
    queue.putMessage(1);
    atomic<bool> raceA{false};
    atomic<bool> raceB{false};
    size_t numConsA = 0;
    size_t numConsB = 0;
    auto thread = std::thread([&] {
      threadStartBaton.post();
      raceB = consumer.consumeUntilDrained(&numConsB) && numConsB;
    });
    threadStartBaton.wait();
    raceA = competingConsumer.consumeUntilDrained(&numConsA) && numConsA;
    callbackBaton.post();
    thread.join();
    EXPECT_FALSE(raceA && raceB);
    EXPECT_TRUE(raceA || raceB);
    EXPECT_TRUE(raceA ^ raceB);
  }
}

#ifdef FOLLY_HAVE_EVENTFD
TEST(NotificationQueueTest, SendOneEventFD) {
  QueueTest qt(0, IntQueue::FdType::EVENTFD);
  qt.sendOne();
}

TEST(NotificationQueueTest, PutMessagesEventFD) {
  QueueTest qt(0, IntQueue::FdType::EVENTFD);
  qt.sendOne();
}

TEST(NotificationQueueTest, MultiConsumerEventFD) {
  QueueTest qt(0, IntQueue::FdType::EVENTFD);
  qt.multiConsumer();
}

TEST(NotificationQueueTest, MaxQueueSizeEventFD) {
  QueueTest qt(5, IntQueue::FdType::EVENTFD);
  qt.maxQueueSize();
}

TEST(NotificationQueueTest, MaxReadAtOnceEventFD) {
  QueueTest qt(0, IntQueue::FdType::EVENTFD);
  qt.maxReadAtOnce();
}

TEST(NotificationQueueTest, DestroyCallbackEventFD) {
  QueueTest qt(0, IntQueue::FdType::EVENTFD);
  qt.destroyCallback();
}
#endif

TEST(NotificationQueueTest, SendOnePipe) {
  QueueTest qt(0, IntQueue::FdType::PIPE);
  qt.sendOne();
}

TEST(NotificationQueueTest, PutMessagesPipe) {
  QueueTest qt(0, IntQueue::FdType::PIPE);
  qt.sendOne();
}

TEST(NotificationQueueTest, MultiConsumerPipe) {
  QueueTest qt(0, IntQueue::FdType::PIPE);
  qt.multiConsumer();
}

TEST(NotificationQueueTest, MaxQueueSizePipe) {
  QueueTest qt(5, IntQueue::FdType::PIPE);
  qt.maxQueueSize();
}

TEST(NotificationQueueTest, MaxReadAtOncePipe) {
  QueueTest qt(0, IntQueue::FdType::PIPE);
  qt.maxReadAtOnce();
}

TEST(NotificationQueueTest, DestroyCallbackPipe) {
  QueueTest qt(0, IntQueue::FdType::PIPE);
  qt.destroyCallback();
}

#ifndef _WIN32
/*
 * Test code that creates a NotificationQueue, then forks, and incorrectly
 * tries to send a message to the queue from the child process.
 *
 * The child process should crash in this scenario, since the child code has a
 * bug.  (Older versions of NotificationQueue didn't catch this in the child,
 * resulting in a crash in the parent process.)
 */
TEST(NotificationQueueTest, UseAfterFork) {
  IntQueue queue;
  int childStatus = 0;
  QueueConsumer consumer;

  // Boost sets a custom SIGCHLD handler, which fails the test if a child
  // process exits abnormally.  We don't want this.
  signal(SIGCHLD, SIG_DFL);

  // Log some info so users reading the test output aren't confused
  // by the child process' crash log messages.
  LOG(INFO) << "This test makes sure the child process crashes.  "
            << "Error log messagges and a backtrace are expected.";

  {
    // Start a separate thread consuming from the queue
    ScopedEventBaseThread t1;
    t1.getEventBase()->runInEventBaseThread(
        [&] { consumer.startConsuming(t1.getEventBase(), &queue); });

    // Send a message to it, just for sanity checking
    queue.putMessage(1234);

    // Fork
    pid_t pid = fork();
    if (pid == 0) {
      // The boost test framework installs signal handlers to catch errors.
      // We only want to catch in the parent.  In the child let SIGABRT crash
      // us normally.
      signal(SIGABRT, SIG_DFL);

      // Child.
      // We're horrible people, so we try to send a message to the queue
      // that is being consumed in the parent process.
      //
      // The putMessage() call should catch this error, and crash our process.
      queue.putMessage(9876);
      // We shouldn't reach here.
      _exit(0);
    }
    PCHECK(pid > 0);

    // Parent.  Wait for the child to exit.
    auto waited = waitpid(pid, &childStatus, 0);
    EXPECT_EQ(pid, waited);

    // Send another message to the queue before we terminate the thread.
    queue.putMessage(5678);
  }

  // The child process should have crashed when it tried to call putMessage()
  // on our NotificationQueue.
  EXPECT_TRUE(WIFSIGNALED(childStatus));
  EXPECT_EQ(SIGABRT, WTERMSIG(childStatus));

  // Make sure the parent saw the expected messages.
  // It should have gotten 1234 and 5678 from the parent process, but not
  // 9876 from the child.
  EXPECT_EQ(2, consumer.messages.size());
  EXPECT_EQ(1234, consumer.messages.front());
  consumer.messages.pop_front();
  EXPECT_EQ(5678, consumer.messages.front());
  consumer.messages.pop_front();
}
#endif

TEST(NotificationQueueConsumer, make) {
  int value = 0;
  EventBase evb;
  NotificationQueue<int> queue(32);

  auto consumer =
      decltype(queue)::Consumer::make([&](int&& msg) noexcept { value = msg; });

  consumer->startConsuming(&evb, &queue);

  int const newValue = 10;
  queue.tryPutMessage(newValue);

  evb.loopOnce();

  EXPECT_EQ(newValue, value);
}
