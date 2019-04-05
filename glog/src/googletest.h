// Copyright (c) 2009, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// Author: Shinichiro Hamaji
//   (based on googletest: http://code.google.com/p/googletest/)

#ifdef GOOGLETEST_H__
#error You must not include this file twice.
#endif
#define GOOGLETEST_H__

#include "utilities.h"

#include <ctype.h>
#include <setjmp.h>
#include <time.h>

#include <map>
#include <sstream>
#include <string>
#include <vector>

#include <stdio.h>
#include <stdlib.h>

#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#ifdef HAVE_UNISTD_H
# include <unistd.h>
#endif

#include "base/commandlineflags.h"

using std::map;
using std::string;
using std::vector;

_START_GOOGLE_NAMESPACE_

extern GOOGLE_GLOG_DLL_DECL void (*g_logging_fail_func)();

_END_GOOGLE_NAMESPACE_

#undef GOOGLE_GLOG_DLL_DECL
#define GOOGLE_GLOG_DLL_DECL

static inline string GetTempDir() {
#ifndef OS_WINDOWS
  return "/tmp";
#else
  char tmp[MAX_PATH];
  GetTempPathA(MAX_PATH, tmp);
  return tmp;
#endif
}

#if defined(OS_WINDOWS) && defined(_MSC_VER) && !defined(TEST_SRC_DIR)
// The test will run in glog/vsproject/<project name>
// (e.g., glog/vsproject/logging_unittest).
static const char TEST_SRC_DIR[] = "../..";
#elif !defined(TEST_SRC_DIR)
# warning TEST_SRC_DIR should be defined in config.h
static const char TEST_SRC_DIR[] = ".";
#endif

DEFINE_string(test_tmpdir, GetTempDir(), "Dir we use for temp files");
DEFINE_string(test_srcdir, TEST_SRC_DIR,
              "Source-dir root, needed to find glog_unittest_flagfile");
DEFINE_bool(run_benchmark, false, "If true, run benchmarks");
#ifdef NDEBUG
DEFINE_int32(benchmark_iters, 100000000, "Number of iterations per benchmark");
#else
DEFINE_int32(benchmark_iters, 100000, "Number of iterations per benchmark");
#endif

#ifdef HAVE_LIB_GTEST
# include <gtest/gtest.h>
// Use our ASSERT_DEATH implementation.
# undef ASSERT_DEATH
# undef ASSERT_DEBUG_DEATH
using testing::InitGoogleTest;
#else

_START_GOOGLE_NAMESPACE_

void InitGoogleTest(int*, char**) {}

// The following is some bare-bones testing infrastructure

#define EXPECT_TRUE(cond)                               \
  do {                                                  \
    if (!(cond)) {                                      \
      fprintf(stderr, "Check failed: %s\n", #cond);     \
      exit(1);                                          \
    }                                                   \
  } while (0)

#define EXPECT_FALSE(cond)  EXPECT_TRUE(!(cond))

#define EXPECT_OP(op, val1, val2)                                       \
  do {                                                                  \
    if (!((val1) op (val2))) {                                          \
      fprintf(stderr, "Check failed: %s %s %s\n", #val1, #op, #val2);   \
      exit(1);                                                          \
    }                                                                   \
  } while (0)

#define EXPECT_EQ(val1, val2)  EXPECT_OP(==, val1, val2)
#define EXPECT_NE(val1, val2)  EXPECT_OP(!=, val1, val2)
#define EXPECT_GT(val1, val2)  EXPECT_OP(>, val1, val2)
#define EXPECT_LT(val1, val2)  EXPECT_OP(<, val1, val2)

#define EXPECT_NAN(arg)                                         \
  do {                                                          \
    if (!isnan(arg)) {                                          \
      fprintf(stderr, "Check failed: isnan(%s)\n", #arg);       \
      exit(1);                                                  \
    }                                                           \
  } while (0)

#define EXPECT_INF(arg)                                         \
  do {                                                          \
    if (!isinf(arg)) {                                          \
      fprintf(stderr, "Check failed: isinf(%s)\n", #arg);       \
      exit(1);                                                  \
    }                                                           \
  } while (0)

#define EXPECT_DOUBLE_EQ(val1, val2)                                    \
  do {                                                                  \
    if (((val1) < (val2) - 0.001 || (val1) > (val2) + 0.001)) {         \
      fprintf(stderr, "Check failed: %s == %s\n", #val1, #val2);        \
      exit(1);                                                          \
    }                                                                   \
  } while (0)

#define EXPECT_STREQ(val1, val2)                                        \
  do {                                                                  \
    if (strcmp((val1), (val2)) != 0) {                                  \
      fprintf(stderr, "Check failed: streq(%s, %s)\n", #val1, #val2);   \
      exit(1);                                                          \
    }                                                                   \
  } while (0)

vector<void (*)()> g_testlist;  // the tests to run

#define TEST(a, b)                                      \
  struct Test_##a##_##b {                               \
    Test_##a##_##b() { g_testlist.push_back(&Run); }    \
    static void Run() { FlagSaver fs; RunTest(); }      \
    static void RunTest();                              \
  };                                                    \
  static Test_##a##_##b g_test_##a##_##b;               \
  void Test_##a##_##b::RunTest()


static inline int RUN_ALL_TESTS() {
  vector<void (*)()>::const_iterator it;
  for (it = g_testlist.begin(); it != g_testlist.end(); ++it) {
    (*it)();
  }
  fprintf(stderr, "Passed %d tests\n\nPASS\n", (int)g_testlist.size());
  return 0;
}

_END_GOOGLE_NAMESPACE_

#endif  // ! HAVE_LIB_GTEST

_START_GOOGLE_NAMESPACE_

static bool g_called_abort;
static jmp_buf g_jmp_buf;
static inline void CalledAbort() {
  g_called_abort = true;
  longjmp(g_jmp_buf, 1);
}

#ifdef OS_WINDOWS
// TODO(hamaji): Death test somehow doesn't work in Windows.
#define ASSERT_DEATH(fn, msg)
#else
#define ASSERT_DEATH(fn, msg)                                           \
  do {                                                                  \
    g_called_abort = false;                                             \
    /* in logging.cc */                                                 \
    void (*original_logging_fail_func)() = g_logging_fail_func;         \
    g_logging_fail_func = &CalledAbort;                                 \
    if (!setjmp(g_jmp_buf)) fn;                                         \
    /* set back to their default */                                     \
    g_logging_fail_func = original_logging_fail_func;                   \
    if (!g_called_abort) {                                              \
      fprintf(stderr, "Function didn't die (%s): %s\n", msg, #fn);      \
      exit(1);                                                          \
    }                                                                   \
  } while (0)
#endif

#ifdef NDEBUG
#define ASSERT_DEBUG_DEATH(fn, msg)
#else
#define ASSERT_DEBUG_DEATH(fn, msg) ASSERT_DEATH(fn, msg)
#endif  // NDEBUG

// Benchmark tools.

#define BENCHMARK(n) static BenchmarkRegisterer __benchmark_ ## n (#n, &n);

map<string, void (*)(int)> g_benchlist;  // the benchmarks to run

class BenchmarkRegisterer {
 public:
  BenchmarkRegisterer(const char* name, void (*function)(int iters)) {
    EXPECT_TRUE(g_benchlist.insert(std::make_pair(name, function)).second);
  }
};

static inline void RunSpecifiedBenchmarks() {
  if (!FLAGS_run_benchmark) {
    return;
  }

  int iter_cnt = FLAGS_benchmark_iters;
  puts("Benchmark\tTime(ns)\tIterations");
  for (map<string, void (*)(int)>::const_iterator iter = g_benchlist.begin();
       iter != g_benchlist.end();
       ++iter) {
    clock_t start = clock();
    iter->second(iter_cnt);
    double elapsed_ns =
        ((double)clock() - start) / CLOCKS_PER_SEC * 1000*1000*1000;
    printf("%s\t%8.2lf\t%10d\n",
           iter->first.c_str(), elapsed_ns / iter_cnt, iter_cnt);
  }
  puts("");
}

// ----------------------------------------------------------------------
// Golden file functions
// ----------------------------------------------------------------------

class CapturedStream {
 public:
  CapturedStream(int fd, const string & filename) :
    fd_(fd),
    uncaptured_fd_(-1),
    filename_(filename) {
    Capture();
  }

  ~CapturedStream() {
    if (uncaptured_fd_ != -1) {
      CHECK(close(uncaptured_fd_) != -1);
    }
  }

  // Start redirecting output to a file
  void Capture() {
    // Keep original stream for later
    CHECK(uncaptured_fd_ == -1) << ", Stream " << fd_ << " already captured!";
    uncaptured_fd_ = dup(fd_);
    CHECK(uncaptured_fd_ != -1);

    // Open file to save stream to
    int cap_fd = open(filename_.c_str(),
                      O_CREAT | O_TRUNC | O_WRONLY,
                      S_IRUSR | S_IWUSR);
    CHECK(cap_fd != -1);

    // Send stdout/stderr to this file
    fflush(NULL);
    CHECK(dup2(cap_fd, fd_) != -1);
    CHECK(close(cap_fd) != -1);
  }

  // Remove output redirection
  void StopCapture() {
    // Restore original stream
    if (uncaptured_fd_ != -1) {
      fflush(NULL);
      CHECK(dup2(uncaptured_fd_, fd_) != -1);
    }
  }

  const string & filename() const { return filename_; }

 private:
  int fd_;             // file descriptor being captured
  int uncaptured_fd_;  // where the stream was originally being sent to
  string filename_;    // file where stream is being saved
};
static CapturedStream * s_captured_streams[STDERR_FILENO+1];
// Redirect a file descriptor to a file.
//   fd       - Should be STDOUT_FILENO or STDERR_FILENO
//   filename - File where output should be stored
static inline void CaptureTestOutput(int fd, const string & filename) {
  CHECK((fd == STDOUT_FILENO) || (fd == STDERR_FILENO));
  CHECK(s_captured_streams[fd] == NULL);
  s_captured_streams[fd] = new CapturedStream(fd, filename);
}
static inline void CaptureTestStderr() {
  CaptureTestOutput(STDERR_FILENO, FLAGS_test_tmpdir + "/captured.err");
}
// Return the size (in bytes) of a file
static inline size_t GetFileSize(FILE * file) {
  fseek(file, 0, SEEK_END);
  return static_cast<size_t>(ftell(file));
}
// Read the entire content of a file as a string
static inline string ReadEntireFile(FILE * file) {
  const size_t file_size = GetFileSize(file);
  char * const buffer = new char[file_size];

  size_t bytes_last_read = 0;  // # of bytes read in the last fread()
  size_t bytes_read = 0;       // # of bytes read so far

  fseek(file, 0, SEEK_SET);

  // Keep reading the file until we cannot read further or the
  // pre-determined file size is reached.
  do {
    bytes_last_read = fread(buffer+bytes_read, 1, file_size-bytes_read, file);
    bytes_read += bytes_last_read;
  } while (bytes_last_read > 0 && bytes_read < file_size);

  const string content = string(buffer, buffer+bytes_read);
  delete[] buffer;

  return content;
}
// Get the captured stdout (when fd is STDOUT_FILENO) or stderr (when
// fd is STDERR_FILENO) as a string
static inline string GetCapturedTestOutput(int fd) {
  CHECK(fd == STDOUT_FILENO || fd == STDERR_FILENO);
  CapturedStream * const cap = s_captured_streams[fd];
  CHECK(cap)
    << ": did you forget CaptureTestStdout() or CaptureTestStderr()?";

  // Make sure everything is flushed.
  cap->StopCapture();

  // Read the captured file.
  FILE * const file = fopen(cap->filename().c_str(), "r");
  const string content = ReadEntireFile(file);
  fclose(file);

  delete cap;
  s_captured_streams[fd] = NULL;

  return content;
}
// Get the captured stderr of a test as a string.
static inline string GetCapturedTestStderr() {
  return GetCapturedTestOutput(STDERR_FILENO);
}

// Check if the string is [IWEF](\d{4}|DATE)
static inline bool IsLoggingPrefix(const string& s) {
  if (s.size() != 5) return false;
  if (!strchr("IWEF", s[0])) return false;
  for (int i = 1; i <= 4; ++i) {
    if (!isdigit(s[i]) && s[i] != "DATE"[i-1]) return false;
  }
  return true;
}

// Convert log output into normalized form.
//
// Example:
//     I0102 030405 logging_unittest.cc:345] RAW: vlog -1
//  => IDATE TIME__ logging_unittest.cc:LINE] RAW: vlog -1
static inline string MungeLine(const string& line) {
  std::istringstream iss(line);
  string before, logcode_date, time, thread_lineinfo;
  iss >> logcode_date;
  while (!IsLoggingPrefix(logcode_date)) {
    before += " " + logcode_date;
    if (!(iss >> logcode_date)) {
      // We cannot find the header of log output.
      return before;
    }
  }
  if (!before.empty()) before += " ";
  iss >> time;
  iss >> thread_lineinfo;
  CHECK(!thread_lineinfo.empty());
  if (thread_lineinfo[thread_lineinfo.size() - 1] != ']') {
    // We found thread ID.
    string tmp;
    iss >> tmp;
    CHECK(!tmp.empty());
    CHECK_EQ(']', tmp[tmp.size() - 1]);
    thread_lineinfo = "THREADID " + tmp;
  }
  size_t index = thread_lineinfo.find(':');
  CHECK_NE(string::npos, index);
  thread_lineinfo = thread_lineinfo.substr(0, index+1) + "LINE]";
  string rest;
  std::getline(iss, rest);
  return (before + logcode_date[0] + "DATE TIME__ " + thread_lineinfo +
          MungeLine(rest));
}

static inline void StringReplace(string* str,
                          const string& oldsub,
                          const string& newsub) {
  size_t pos = str->find(oldsub);
  if (pos != string::npos) {
    str->replace(pos, oldsub.size(), newsub.c_str());
  }
}

static inline string Munge(const string& filename) {
  FILE* fp = fopen(filename.c_str(), "rb");
  CHECK(fp != NULL) << filename << ": couldn't open";
  char buf[4096];
  string result;
  while (fgets(buf, 4095, fp)) {
    string line = MungeLine(buf);
    char null_str[256];
    sprintf(null_str, "%p", static_cast<void*>(NULL));
    StringReplace(&line, "__NULLP__", null_str);
    // Remove 0x prefix produced by %p. VC++ doesn't put the prefix.
    StringReplace(&line, " 0x", " ");

    StringReplace(&line, "__SUCCESS__", StrError(0));
    StringReplace(&line, "__ENOENT__", StrError(ENOENT));
    StringReplace(&line, "__EINTR__", StrError(EINTR));
    StringReplace(&line, "__ENXIO__", StrError(ENXIO));
    StringReplace(&line, "__ENOEXEC__", StrError(ENOEXEC));
    result += line + "\n";
  }
  fclose(fp);
  return result;
}

static inline void WriteToFile(const string& body, const string& file) {
  FILE* fp = fopen(file.c_str(), "wb");
  fwrite(body.data(), 1, body.size(), fp);
  fclose(fp);
}

static inline bool MungeAndDiffTestStderr(const string& golden_filename) {
  CapturedStream* cap = s_captured_streams[STDERR_FILENO];
  CHECK(cap) << ": did you forget CaptureTestStderr()?";

  cap->StopCapture();

  // Run munge
  const string captured = Munge(cap->filename());
  const string golden = Munge(golden_filename);
  if (captured != golden) {
    fprintf(stderr,
            "Test with golden file failed. We'll try to show the diff:\n");
    string munged_golden = golden_filename + ".munged";
    WriteToFile(golden, munged_golden);
    string munged_captured = cap->filename() + ".munged";
    WriteToFile(captured, munged_captured);
    string diffcmd("diff -u " + munged_golden + " " + munged_captured);
    if (system(diffcmd.c_str()) != 0) {
      fprintf(stderr, "diff command was failed.\n");
    }
    unlink(munged_golden.c_str());
    unlink(munged_captured.c_str());
    return false;
  }
  LOG(INFO) << "Diff was successful";
  return true;
}

// Save flags used from logging_unittest.cc.
#ifndef HAVE_LIB_GFLAGS
struct FlagSaver {
  FlagSaver()
      : v_(FLAGS_v),
        stderrthreshold_(FLAGS_stderrthreshold),
        logtostderr_(FLAGS_logtostderr),
        alsologtostderr_(FLAGS_alsologtostderr) {}
  ~FlagSaver() {
    FLAGS_v = v_;
    FLAGS_stderrthreshold = stderrthreshold_;
    FLAGS_logtostderr = logtostderr_;
    FLAGS_alsologtostderr = alsologtostderr_;
  }
  int v_;
  int stderrthreshold_;
  bool logtostderr_;
  bool alsologtostderr_;
};
#endif

class Thread {
 public:
  virtual ~Thread() {}

  void SetJoinable(bool) {}
#if defined(OS_WINDOWS) || defined(OS_CYGWIN)
  void Start() {
    handle_ = CreateThread(NULL,
                           0,
                           (LPTHREAD_START_ROUTINE)&Thread::InvokeThread,
                           (LPVOID)this,
                           0,
                           &th_);
    CHECK(handle_) << "CreateThread";
  }
  void Join() {
    WaitForSingleObject(handle_, INFINITE);
  }
#elif defined(HAVE_PTHREAD)
  void Start() {
    pthread_create(&th_, NULL, &Thread::InvokeThread, this);
  }
  void Join() {
    pthread_join(th_, NULL);
  }
#else
# error No thread implementation.
#endif

 protected:
  virtual void Run() = 0;

 private:
  static void* InvokeThread(void* self) {
    ((Thread*)self)->Run();
    return NULL;
  }

#if defined(OS_WINDOWS) || defined(OS_CYGWIN)
  HANDLE handle_;
  DWORD th_;
#else
  pthread_t th_;
#endif
};

static inline void SleepForMilliseconds(int t) {
#ifndef OS_WINDOWS
  usleep(t * 1000);
#else
  Sleep(t);
#endif
}

// Add hook for operator new to ensure there are no memory allocation.

void (*g_new_hook)() = NULL;

_END_GOOGLE_NAMESPACE_

void* operator new(size_t size) throw(std::bad_alloc) {
  if (GOOGLE_NAMESPACE::g_new_hook) {
    GOOGLE_NAMESPACE::g_new_hook();
  }
  return malloc(size);
}

void* operator new[](size_t size) throw(std::bad_alloc) {
  return ::operator new(size);
}

void operator delete(void* p) throw() {
  free(p);
}

void operator delete[](void* p) throw() {
  ::operator delete(p);
}
