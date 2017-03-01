// Copyright 2004-present Facebook. All Rights Reserved.

#include "CxxMessageQueue.h"

#include <folly/AtomicIntrusiveLinkedList.h>

#include <unordered_map>
#include <mutex>
#include <queue>

#include <glog/logging.h>

namespace facebook {
namespace react {

using detail::BinarySemaphore;
using detail::EventFlag;

using clock = std::chrono::steady_clock;
using time_point = clock::time_point;
static_assert(std::is_same<time_point, EventFlag::time_point>::value, "");

namespace {
time_point now() {
  return clock::now();
}

class Task {
 public:
  static Task* create(std::function<void()>&& func) {
    return new Task{std::move(func), false, time_point()};
  }

  static Task* createSync(std::function<void()>&& func) {
    return new Task{std::move(func), true, time_point()};
  }

  static Task* createDelayed(std::function<void()>&& func, time_point startTime) {
    return new Task{std::move(func), false, startTime};
  }

  std::function<void()> func;
  // This flag is just to mark that the task is expected to be synchronous. If
  // a synchronous task races with stopping the queue, the thread waiting on
  // the synchronous task might never resume. We use this flag to detect this
  // case and throw an error.
  bool sync;
  time_point startTime;

  folly::AtomicIntrusiveLinkedListHook<Task> hook;

  // Should this sort consider id also?
  struct Compare {
    bool operator()(const Task* a, const Task* b) {
      return a->startTime > b->startTime;
    }
  };
};

class DelayedTaskQueue {
 public:
  ~DelayedTaskQueue() {
    while (!queue_.empty()) {
      delete queue_.top();
      queue_.pop();
    }
  }

  void process() {
    while (!queue_.empty()) {
      Task* d = queue_.top();
      if (now() < d->startTime) {
        break;
      }
      auto owned = std::unique_ptr<Task>(queue_.top());
      queue_.pop();
      owned->func();
    }
  }

  void push(Task* t) {
    queue_.push(t);
  }

  bool empty() {
    return queue_.empty();
  }

  time_point nextTime() {
    return queue_.top()->startTime;
  }
 private:
  std::priority_queue<Task*, std::vector<Task*>, Task::Compare> queue_;
};

}

class CxxMessageQueue::QueueRunner {
 public:
  ~QueueRunner() {
    queue_.sweep([] (Task* t) {
        delete t;
      });
  }

  void enqueue(std::function<void()>&& func) {
    enqueueTask(Task::create(std::move(func)));
  }

  void enqueueDelayed(std::function<void()>&& func, uint64_t delayMs) {
    if (delayMs) {
      enqueueTask(Task::createDelayed(std::move(func), now() + std::chrono::milliseconds(delayMs)));
    } else {
      enqueue(std::move(func));
    }
  }

  void enqueueSync(std::function<void()>&& func) {
    EventFlag done;
    enqueueTask(Task::createSync([&] () mutable {
        func();
        done.set();
      }));
    if (stopped_) {
      // If this queue is stopped_, the sync task might never actually run.
      throw std::runtime_error("Stopped within enqueueSync.");
    }
    done.wait();
  }

  void stop() {
    stopped_ = true;
    pending_.set();
  }

  bool isStopped() {
    return stopped_;
  }

  void quitSynchronous() {
    stop();
    finished_.wait();
  }

  void run() {
    // If another thread stops this one, then the acquire-release on pending_
    // ensures that we read stopped some time after it was set (and other
    // threads just have to deal with the fact that we might run a task "after"
    // they stop us).
    //
    // If we are stopped on this thread, then memory order doesn't really
    // matter reading stopped_.
    while (!stopped_.load(std::memory_order_relaxed)) {
      sweep();
      if (delayed_.empty()) {
        pending_.wait();
      } else {
        pending_.wait_until(delayed_.nextTime());
      }
    }
    // This sweep is just to catch erroneous enqueueSync. That is, there could
    // be a task marked sync that another thread is waiting for, but we'll
    // never actually run it.
    sweep();
    finished_.set();
  }

  // We are processing two queues, the posted tasks (queue_) and the delayed
  // tasks (delayed_). Delayed tasks first go into posted tasks, and then are
  // moved to the delayed queue if we pop them before the time they are
  // scheduled for.
  // As we pop things from queue_, before dealing with that thing, we run any
  // delayed tasks whose scheduled time has arrived.
  void sweep() {
    queue_.sweep([this] (Task* t) {
        std::unique_ptr<Task> owned(t);
        if (stopped_.load(std::memory_order_relaxed)) {
          if (t->sync) {
            throw std::runtime_error("Sync task posted while stopped.");
          }
          return;
        }

        delayed_.process();
        if (t->startTime != time_point() && now() <= t->startTime) {
          delayed_.push(owned.release());
        } else {
          t->func();
        }
    });
    delayed_.process();
  }

  void bindToThisThread() {
    // TODO: handle nested runloops (either allow them or throw an exception).
    if (tid_ != std::thread::id{}) {
      throw std::runtime_error("Message queue already bound to thread.");
    }
    tid_ = std::this_thread::get_id();
  }

  bool isOnQueue() {
    return std::this_thread::get_id() == tid_;
  }

 private:
  void enqueueTask(Task* task) {
    if (queue_.insertHead(task)) {
      pending_.set();
    }
  }

  std::thread::id tid_;

  folly::AtomicIntrusiveLinkedList<Task, &Task::hook> queue_;

  std::atomic_bool stopped_{false};
  DelayedTaskQueue delayed_;

  BinarySemaphore pending_;
  EventFlag finished_;
};


CxxMessageQueue::CxxMessageQueue() : qr_(new QueueRunner()) {

}

CxxMessageQueue::~CxxMessageQueue() {
  // TODO(cjhopman): Add detach() so that the queue doesn't have to be
  // explicitly stopped.
  if (!qr_->isStopped()) {
    LOG(FATAL) << "Queue not stopped.";
  }
}

void CxxMessageQueue::runOnQueue(std::function<void()>&& func) {
  qr_->enqueue(std::move(func));
}

void CxxMessageQueue::runOnQueueDelayed(std::function<void()>&& func, uint64_t delayMs) {
  qr_->enqueueDelayed(std::move(func), delayMs);
}

void CxxMessageQueue::runOnQueueSync(std::function<void()>&& func) {
  if (isOnQueue()) {
    func();
    return;
  }
  qr_->enqueueSync(std::move(func));
}

void CxxMessageQueue::quitSynchronous() {
  if (isOnQueue()) {
    qr_->stop();
  } else {
    qr_->quitSynchronous();
  }
}

bool CxxMessageQueue::isOnQueue() {
  return qr_->isOnQueue();
}

namespace {
struct MQRegistry {
  std::weak_ptr<CxxMessageQueue> find(std::thread::id tid) {
    std::lock_guard<std::mutex> g(lock_);
    auto iter = registry_.find(tid);
    if (iter == registry_.end()) return std::weak_ptr<CxxMessageQueue>();
    return iter->second;
  }

  void registerQueue(std::thread::id tid, std::weak_ptr<CxxMessageQueue> mq) {
    std::lock_guard<std::mutex> g(lock_);
    registry_[tid] = mq;
  }

  void unregister(std::thread::id tid) {
    std::lock_guard<std::mutex> g(lock_);
    registry_.erase(tid);
  }
 private:
  std::mutex lock_;
  std::unordered_map<std::thread::id, std::weak_ptr<CxxMessageQueue>> registry_;
};

MQRegistry& getMQRegistry() {
  static MQRegistry* mq_registry = new MQRegistry();
  return *mq_registry;
}
}

std::shared_ptr<CxxMessageQueue> CxxMessageQueue::current() {
  auto tid = std::this_thread::get_id();
  return getMQRegistry().find(tid).lock();
}

std::function<void()> CxxMessageQueue::getUnregisteredRunLoop() {
  return [capture=qr_] {
    capture->bindToThisThread();
    capture->run();
  };
}

std::function<void()> CxxMessageQueue::getRunLoop(std::shared_ptr<CxxMessageQueue> mq) {
  return [capture=mq->qr_, weakMq=std::weak_ptr<CxxMessageQueue>(mq)] {
    capture->bindToThisThread();
    auto tid = std::this_thread::get_id();

    getMQRegistry().registerQueue(tid, weakMq);
    capture->run();
    getMQRegistry().unregister(tid);
  };
}



}  // namespace react
}  // namespace facebook
