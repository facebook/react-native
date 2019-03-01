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

#include <folly/test/DeterministicSchedule.h>

#include <assert.h>

#include <algorithm>
#include <list>
#include <mutex>
#include <random>
#include <unordered_map>
#include <utility>

#include <folly/Random.h>

namespace folly {
namespace test {

FOLLY_TLS sem_t* DeterministicSchedule::tls_sem;
FOLLY_TLS DeterministicSchedule* DeterministicSchedule::tls_sched;
FOLLY_TLS unsigned DeterministicSchedule::tls_threadId;
thread_local AuxAct DeterministicSchedule::tls_aux_act;
AuxChk DeterministicSchedule::aux_chk;

// access is protected by futexLock
static std::unordered_map<detail::Futex<DeterministicAtomic>*,
                          std::list<std::pair<uint32_t, bool*>>> futexQueues;

static std::mutex futexLock;

DeterministicSchedule::DeterministicSchedule(
    const std::function<size_t(size_t)>& scheduler)
    : scheduler_(scheduler), nextThreadId_(1), step_(0) {
  assert(tls_sem == nullptr);
  assert(tls_sched == nullptr);
  assert(tls_aux_act == nullptr);

  tls_sem = new sem_t;
  sem_init(tls_sem, 0, 1);
  sems_.push_back(tls_sem);

  tls_sched = this;
}

DeterministicSchedule::~DeterministicSchedule() {
  assert(tls_sched == this);
  assert(sems_.size() == 1);
  assert(sems_[0] == tls_sem);
  beforeThreadExit();
}

std::function<size_t(size_t)> DeterministicSchedule::uniform(uint64_t seed) {
  auto rand = std::make_shared<std::ranlux48>(seed);
  return [rand](size_t numActive) {
    auto dist = std::uniform_int_distribution<size_t>(0, numActive - 1);
    return dist(*rand);
  };
}

struct UniformSubset {
  UniformSubset(uint64_t seed, size_t subsetSize, size_t stepsBetweenSelect)
      : uniform_(DeterministicSchedule::uniform(seed)),
        subsetSize_(subsetSize),
        stepsBetweenSelect_(stepsBetweenSelect),
        stepsLeft_(0) {}

  size_t operator()(size_t numActive) {
    adjustPermSize(numActive);
    if (stepsLeft_-- == 0) {
      stepsLeft_ = stepsBetweenSelect_ - 1;
      shufflePrefix();
    }
    return perm_[uniform_(std::min(numActive, subsetSize_))];
  }

 private:
  std::function<size_t(size_t)> uniform_;
  const size_t subsetSize_;
  const size_t stepsBetweenSelect_;

  size_t stepsLeft_;
  // only the first subsetSize_ is properly randomized
  std::vector<size_t> perm_;

  void adjustPermSize(size_t numActive) {
    if (perm_.size() > numActive) {
      perm_.erase(std::remove_if(perm_.begin(),
                                 perm_.end(),
                                 [=](size_t x) { return x >= numActive; }),
                  perm_.end());
    } else {
      while (perm_.size() < numActive) {
        perm_.push_back(perm_.size());
      }
    }
    assert(perm_.size() == numActive);
  }

  void shufflePrefix() {
    for (size_t i = 0; i < std::min(perm_.size() - 1, subsetSize_); ++i) {
      size_t j = uniform_(perm_.size() - i) + i;
      std::swap(perm_[i], perm_[j]);
    }
  }
};

std::function<size_t(size_t)>
DeterministicSchedule::uniformSubset(uint64_t seed, size_t n, size_t m) {
  auto gen = std::make_shared<UniformSubset>(seed, n, m);
  return [=](size_t numActive) { return (*gen)(numActive); };
}

void DeterministicSchedule::beforeSharedAccess() {
  if (tls_sem) {
    sem_wait(tls_sem);
  }
}

void DeterministicSchedule::afterSharedAccess() {
  auto sched = tls_sched;
  if (!sched) {
    return;
  }
  sem_post(sched->sems_[sched->scheduler_(sched->sems_.size())]);
}

void DeterministicSchedule::afterSharedAccess(bool success) {
  auto sched = tls_sched;
  if (!sched) {
    return;
  }
  sched->callAux(success);
  sem_post(sched->sems_[sched->scheduler_(sched->sems_.size())]);
}

size_t DeterministicSchedule::getRandNumber(size_t n) {
  if (tls_sched) {
    return tls_sched->scheduler_(n);
  }
  return Random::rand32() % n;
}

int DeterministicSchedule::getcpu(unsigned* cpu,
                                  unsigned* node,
                                  void* /* unused */) {
  if (!tls_threadId && tls_sched) {
    beforeSharedAccess();
    tls_threadId = tls_sched->nextThreadId_++;
    afterSharedAccess();
  }
  if (cpu) {
    *cpu = tls_threadId;
  }
  if (node) {
    *node = tls_threadId;
  }
  return 0;
}

void DeterministicSchedule::setAuxAct(AuxAct& aux) {
  tls_aux_act = aux;
}

void DeterministicSchedule::setAuxChk(AuxChk& aux) {
  aux_chk = aux;
}

void DeterministicSchedule::clearAuxChk() {
  aux_chk = nullptr;
}

sem_t* DeterministicSchedule::beforeThreadCreate() {
  sem_t* s = new sem_t;
  sem_init(s, 0, 0);
  beforeSharedAccess();
  sems_.push_back(s);
  afterSharedAccess();
  return s;
}

void DeterministicSchedule::afterThreadCreate(sem_t* sem) {
  assert(tls_sem == nullptr);
  assert(tls_sched == nullptr);
  tls_sem = sem;
  tls_sched = this;
  bool started = false;
  while (!started) {
    beforeSharedAccess();
    if (active_.count(std::this_thread::get_id()) == 1) {
      started = true;
    }
    afterSharedAccess();
  }
}

void DeterministicSchedule::beforeThreadExit() {
  assert(tls_sched == this);
  beforeSharedAccess();
  sems_.erase(std::find(sems_.begin(), sems_.end(), tls_sem));
  active_.erase(std::this_thread::get_id());
  if (sems_.size() > 0) {
    FOLLY_TEST_DSCHED_VLOG("exiting");
    afterSharedAccess();
  }
  sem_destroy(tls_sem);
  delete tls_sem;
  tls_sem = nullptr;
  tls_sched = nullptr;
  tls_aux_act = nullptr;
}

void DeterministicSchedule::join(std::thread& child) {
  auto sched = tls_sched;
  if (sched) {
    bool done = false;
    while (!done) {
      beforeSharedAccess();
      done = !sched->active_.count(child.get_id());
      if (done) {
        FOLLY_TEST_DSCHED_VLOG("joined " << std::hex << child.get_id());
      }
      afterSharedAccess();
    }
  }
  child.join();
}

void DeterministicSchedule::callAux(bool success) {
  ++step_;
  if (tls_aux_act) {
    tls_aux_act(success);
    tls_aux_act = nullptr;
  }
  if (aux_chk) {
    aux_chk(step_);
  }
}

void DeterministicSchedule::post(sem_t* sem) {
  beforeSharedAccess();
  sem_post(sem);
  FOLLY_TEST_DSCHED_VLOG("sem_post(" << sem << ")");
  afterSharedAccess();
}

bool DeterministicSchedule::tryWait(sem_t* sem) {
  beforeSharedAccess();
  int rv = sem_trywait(sem);
  int e = rv == 0 ? 0 : errno;
  FOLLY_TEST_DSCHED_VLOG("sem_trywait(" << sem << ") = " << rv
                                        << " errno=" << e);
  afterSharedAccess();
  if (rv == 0) {
    return true;
  } else {
    assert(e == EAGAIN);
    return false;
  }
}

void DeterministicSchedule::wait(sem_t* sem) {
  while (!tryWait(sem)) {
    // we're not busy waiting because this is a deterministic schedule
  }
}
}
}

namespace folly {
namespace detail {

using namespace test;
using namespace std::chrono;

template <>
FutexResult Futex<DeterministicAtomic>::futexWaitImpl(
    uint32_t expected,
    time_point<system_clock>* absSystemTimeout,
    time_point<steady_clock>* absSteadyTimeout,
    uint32_t waitMask) {
  bool hasTimeout = absSystemTimeout != nullptr || absSteadyTimeout != nullptr;
  bool awoken = false;
  FutexResult result = FutexResult::AWOKEN;

  DeterministicSchedule::beforeSharedAccess();
  FOLLY_TEST_DSCHED_VLOG(this << ".futexWait(" << std::hex << expected
                              << ", .., " << std::hex << waitMask
                              << ") beginning..");
  futexLock.lock();
  if (this->data == expected) {
    auto& queue = futexQueues[this];
    queue.emplace_back(waitMask, &awoken);
    auto ours = queue.end();
    ours--;
    while (!awoken) {
      futexLock.unlock();
      DeterministicSchedule::afterSharedAccess();
      DeterministicSchedule::beforeSharedAccess();
      futexLock.lock();

      // Simulate spurious wake-ups, timeouts each time with
      // a 10% probability if we haven't been woken up already
      if (!awoken && hasTimeout &&
          DeterministicSchedule::getRandNumber(100) < 10) {
        assert(futexQueues.count(this) != 0 && &futexQueues[this] == &queue);
        queue.erase(ours);
        if (queue.empty()) {
          futexQueues.erase(this);
        }
        // Simulate ETIMEDOUT 90% of the time and other failures
        // remaining time
        result = DeterministicSchedule::getRandNumber(100) >= 10
                     ? FutexResult::TIMEDOUT
                     : FutexResult::INTERRUPTED;
        break;
      }
    }
  } else {
    result = FutexResult::VALUE_CHANGED;
  }
  futexLock.unlock();

  char const* resultStr = "?";
  switch (result) {
    case FutexResult::AWOKEN:
      resultStr = "AWOKEN";
      break;
    case FutexResult::TIMEDOUT:
      resultStr = "TIMEDOUT";
      break;
    case FutexResult::INTERRUPTED:
      resultStr = "INTERRUPTED";
      break;
    case FutexResult::VALUE_CHANGED:
      resultStr = "VALUE_CHANGED";
      break;
  }
  FOLLY_TEST_DSCHED_VLOG(this << ".futexWait(" << std::hex << expected
                              << ", .., " << std::hex << waitMask << ") -> "
                              << resultStr);
  DeterministicSchedule::afterSharedAccess();
  return result;
}

template <>
int Futex<DeterministicAtomic>::futexWake(int count, uint32_t wakeMask) {
  int rv = 0;
  DeterministicSchedule::beforeSharedAccess();
  futexLock.lock();
  if (futexQueues.count(this) > 0) {
    auto& queue = futexQueues[this];
    auto iter = queue.begin();
    while (iter != queue.end() && rv < count) {
      auto cur = iter++;
      if ((cur->first & wakeMask) != 0) {
        *(cur->second) = true;
        rv++;
        queue.erase(cur);
      }
    }
    if (queue.empty()) {
      futexQueues.erase(this);
    }
  }
  futexLock.unlock();
  FOLLY_TEST_DSCHED_VLOG(this << ".futexWake(" << count << ", " << std::hex
                              << wakeMask << ") -> " << rv);
  DeterministicSchedule::afterSharedAccess();
  return rv;
}

template <>
CacheLocality const& CacheLocality::system<test::DeterministicAtomic>() {
  static CacheLocality cache(CacheLocality::uniform(16));
  return cache;
}

template <>
Getcpu::Func AccessSpreader<test::DeterministicAtomic>::pickGetcpuFunc() {
  return &DeterministicSchedule::getcpu;
}
}
}
