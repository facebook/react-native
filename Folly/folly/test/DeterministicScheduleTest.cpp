/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

using namespace folly::test;

TEST(DeterministicSchedule, uniform) {
  auto p = DeterministicSchedule::uniform(0);
  int buckets[10] = {};
  for (int i = 0; i < 100000; ++i) {
    buckets[p(10)]++;
  }
  for (int i = 0; i < 10; ++i) {
    EXPECT_TRUE(buckets[i] > 9000);
  }
}

TEST(DeterministicSchedule, uniformSubset) {
  auto ps = DeterministicSchedule::uniformSubset(0, 3, 100);
  int buckets[10] = {};
  std::set<int> seen;
  for (int i = 0; i < 100000; ++i) {
    if (i > 0 && (i % 100) == 0) {
      EXPECT_EQ(seen.size(), 3);
      seen.clear();
    }
    int x = ps(10);
    seen.insert(x);
    EXPECT_TRUE(seen.size() <= 3);
    buckets[x]++;
  }
  for (int i = 0; i < 10; ++i) {
    EXPECT_TRUE(buckets[i] > 9000);
  }
}

TEST(DeterministicSchedule, buggyAdd) {
  for (bool bug : {false, true}) {
    DeterministicSchedule sched(DeterministicSchedule::uniform(0));
    if (bug) {
      FOLLY_TEST_DSCHED_VLOG("Test with race condition");
    } else {
      FOLLY_TEST_DSCHED_VLOG("Test without race condition");
    }
    DeterministicMutex m;
    // The use of DeterinisticAtomic is not needed here, but it makes
    // it easier to understand the sequence of events in logs.
    DeterministicAtomic<int> test{0};
    DeterministicAtomic<int> baseline{0};
    int numThreads = 10;
    std::vector<std::thread> threads(numThreads);
    for (int t = 0; t < numThreads; ++t) {
      threads[t] = DeterministicSchedule::thread([&, t] {
        baseline.fetch_add(1);
        // Atomic increment of test protected by mutex m
        do {
          // Some threads use lock() others use try_lock()
          if ((t & 1) == 0) {
            m.lock();
          } else {
            if (!m.try_lock()) {
              continue;
            }
          }
          int newval = test.load() + 1;
          if (bug) {
            // Break the atomicity of the increment operation
            m.unlock();
            m.lock();
          }
          test.store(newval);
          m.unlock();
          break;
        } while (true);
      }); // thread lambda
    } // for t
    for (auto& t : threads) {
      DeterministicSchedule::join(t);
    }
    if (!bug) {
      EXPECT_EQ(test.load(), baseline.load());
    } else {
      if (test.load() == baseline.load()) {
        FOLLY_TEST_DSCHED_VLOG("Didn't catch the bug");
      } else {
        FOLLY_TEST_DSCHED_VLOG("Caught the bug");
      }
    }
  } // for bug
}

/*
 * Test DSched support for auxiliary data and global invariants
 *
 * How to use DSched support for auxiliary data and global invariants
 * (Let Foo<T, Atom> be the template to be tested):
 *   1. Add friend AnnotatedFoo<T> to Foo<T,Atom> (Typically, in Foo.h).
 *   2. Define a class AuxData for whatever auxiliary data is needed
 *      to maintain global knowledge of shared and private state.
 *   3. Define:
 *        static AuxData* aux_;
 *        static FOLLY_TLS uint32_t tid_;
 *   4. (Optional) Define gflags for command line options. E.g.:
 *        DEFINE_int64(seed, 0, "Seed for random number generators");
 *   5. (Optionl) Define macros for mangement of auxiliary data. E.g.,
 *        #define AUX_THR(x)    (aux_->t_[tid_]->x)
 *   6. (Optional) Define macro for creating auxiliary actions. E.g.,
 *        #define AUX_ACT(act)                                       \
 *          {                                                        \
 *            AUX_THR(func_) = __func__;                             \
 *            AUX_THR(line_) = __LINE__;                             \
 *            AuxAct auxact([&](bool success) { if (success); act}); \
 *            DeterministicSchedule::setAuxAct(auxact);              \
 *          }
 *      [Note: Auxiliary actions must not contain any standard shared
 *      accesses, or else deadlock will occur. Use the load_direct()
 *      member function of DeterministicAtomic instead.]
 *   7. Define AnnotatedFoo<T> derived from Foo<T,DeterministicAtomic>.
 *   8. Define member functions in AnnotatedFoo to manage DSched::auxChk.
 *   9. Define member functions for logging and checkig global invariants.
 *  10. Define member functions for direct access to data members of Foo.
 *  11. (Optional) Add a member function dummyStep() to update
 *      auxiliary data race-free when the next step is unknoown or
 *      not conveniently accessible (e.g., in a different
 *      library). The functions adds a dummy shared step to force
 *      DSched to invoke the auxiliary action at a known point.This
 *      is needed for now because DSched allows threads to run in
 *      parallel between shared accesses. Hence, concurrent updates
 *      of shared auxiliary data can be racy if executed outside
 *      auxiliary actions. This may be obviated in the future if
 *      DSched supports fully seriallized execution.
 *        void dummyStep() {
 *          DeterministicSchedule::beforeSharedAccess();
 *          DeterministicSchedule::afterSharedAccess(true);
 *        }
 *  12. Override member functions of Foo as needed in order to
 *      annotate the code with auxiliary actions. [Note: There may be
 *      a lot of duplication of Foo's code. Alternatively, Foo can be
 *      annotated directly.]
 *  13. Define TEST using instances of AuxData and AnnotatedFoo.
 *  14. For debugging, iteratively add (as needed) auxiliary data,
 *      global invariants, logging details, command line flags as
 *      needed and selectively generate relevant logs to detect the
 *      race condition shortly after it occurs.
 *
 * In the following example Foo = AtomicCounter
 */

using DSched = DeterministicSchedule;

/** Forward declaration of annotated template */
template <typename T>
struct AnnotatedAtomicCounter;

/** Original template to be tested */
template <typename T, template <typename> class Atom = std::atomic>
class AtomicCounter {
  /** Friend declaration to allow full access */
  friend struct AnnotatedAtomicCounter<T>;

 public:
  explicit AtomicCounter(T val) : counter_(val) {}

  void inc() {
    this->counter_.fetch_add(1);
  }

  void incBug() {
    this->counter_.store(this->counter_.load() + 1);
  }

  T load() {
    return this->counter_.load();
  }

 private:
  Atom<T> counter_ = {0};
};

/** auxiliary data */
struct AuxData {
  using T = int;

  /* General */
  uint64_t step_ = {0};
  uint64_t lastUpdate_ = {0};

  struct PerThread {
    /* General */
    std::string func_;
    int line_;
    /* Custom */
    T count_ = {0};
  };

  std::vector<PerThread> t_;

  explicit AuxData(int nthr) : t_(nthr) {}
};

static AuxData* aux_;
static FOLLY_TLS uint32_t tid_;

/* Command line flags */
DEFINE_int64(seed, 0, "Seed for random number generators");
DEFINE_int64(max_steps, 1000000, "Max. number of shared steps for the test");
DEFINE_int64(num_reps, 1, "Number of test repetitions");
DEFINE_int64(num_ops, 1000, "Number of increments per repetition");
DEFINE_int64(liveness_thresh, 1000000, "Liveness threshold");
DEFINE_int64(log_begin, 0, "Step number to start logging. No logging if <= 0");
DEFINE_int64(log_length, 1000, "Length of step by step log (if log_begin > 0)");
DEFINE_int64(log_freq, 100000, "Log every so many steps");
DEFINE_int32(num_threads, 1, "Number of producers");
DEFINE_bool(bug, false, "Introduce bug");

/** Aux macros */
#define AUX_THR(x) (aux_->t_[tid_].x)
#define AUX_UPDATE() (aux_->lastUpdate_ = aux_->step_ + 1)

/** Macro for inline definition of auxiliary actions */
#define AUX_ACT(act)                         \
  do {                                       \
    AUX_THR(func_) = __func__;               \
    AUX_THR(line_) = __LINE__;               \
    AuxAct auxfn([&](bool success) {         \
      if (success) {                         \
      }                                      \
      if (true) {                            \
        act                                  \
      }                                      \
    });                                      \
    DeterministicSchedule::setAuxAct(auxfn); \
  } while (0)

/** Alias for original class */
template <typename T>
using Base = AtomicCounter<T, DeterministicAtomic>;

/** Annotated shared class */
template <typename T>
struct AnnotatedAtomicCounter : public Base<T> {
  /** Manage DSched auxChk */
  void setAuxChk() {
    AuxChk auxfn([&](uint64_t step) {
      auxLog(step);
      auxCheck();
    });
    DeterministicSchedule::setAuxChk(auxfn);
  }

  void clearAuxChk() {
    DeterministicSchedule::clearAuxChk();
  }

  /** Aux log function */
  void auxLog(uint64_t step) {
    if (aux_->step_ == 0) {
      aux_->lastUpdate_ = step;
    }
    aux_->step_ = step;
    if (step > (uint64_t)FLAGS_max_steps) {
      exit(0);
    }
    bool doLog =
        (((FLAGS_log_begin > 0) && (step >= (uint64_t)FLAGS_log_begin) &&
          (step <= (uint64_t)FLAGS_log_begin + FLAGS_log_length)) ||
         ((step % FLAGS_log_freq) == 0));
    if (doLog) {
      doAuxLog(step);
    }
  }

  void doAuxLog(uint64_t step) {
    std::stringstream ss;
    /* General */
    ss << step << " - " << aux_->lastUpdate_ << " --";
    /* Shared */
    ss << " counter =" << this->counter_.load_direct();
    /* Thread */
    ss << " -- t" << tid_ << " " << AUX_THR(func_) << ":" << AUX_THR(line_);
    ss << " count[" << tid_ << "] = " << AUX_THR(count_);
    /* Output */
    std::cerr << ss.str() << std::endl;
  }

  void auxCheck() {
    /* Liveness */
    CHECK_LT(aux_->step_, aux_->lastUpdate_ + FLAGS_liveness_thresh);
    /* Safety */
    int sum = {0};
    for (auto& t : aux_->t_) {
      sum += t.count_;
    }
    CHECK_EQ(this->counter_.load_direct(), sum);
  }

  /* Direct access without going through DSched */
  T loadDirect() {
    return this->counter_.load_direct();
  }

  /* Constructor -- calls original constructor */
  explicit AnnotatedAtomicCounter(int val) : Base<T>(val) {}

  /* Overloads of original member functions (as needed) */

  void inc() {
    AUX_ACT({ ++AUX_THR(count_); });
    this->counter_.fetch_add(1);
  }

  void incBug() {
    AUX_ACT({});
    T newval = this->counter_.load() + 1;
    AUX_ACT({ ++AUX_THR(count_); });
    this->counter_.store(newval);
  }
};

using Annotated = AnnotatedAtomicCounter<int>;

TEST(DeterministicSchedule, global_invariants) {
  CHECK_GT(FLAGS_num_threads, 0);

  DSched sched(DSched::uniform(FLAGS_seed));
  for (int i = 0; i < FLAGS_num_reps; ++i) {
    aux_ = new AuxData(FLAGS_num_threads);
    Annotated annotated(0);
    annotated.setAuxChk();

    std::vector<std::thread> threads(FLAGS_num_threads);
    for (int tid = 0; tid < FLAGS_num_threads; ++tid) {
      threads[tid] = DSched::thread([&, tid]() {
        tid_ = tid;
        for (int j = tid; j < FLAGS_num_ops; j += FLAGS_num_threads) {
          (FLAGS_bug) ? annotated.incBug() : annotated.inc();
        }
      });
    }
    for (auto& t : threads) {
      DSched::join(t);
    }
    std::cerr << "====== rep " << i << " completed in step " << aux_->step_
              << std::endl;
    annotated.doAuxLog(aux_->step_);
    std::cerr << std::endl;
    EXPECT_EQ(annotated.loadDirect(), FLAGS_num_ops);
    annotated.clearAuxChk();
    delete aux_;
  }
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
