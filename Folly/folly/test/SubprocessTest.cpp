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

#include <folly/Subprocess.h>

#include <sys/types.h>

#include <boost/container/flat_set.hpp>
#include <glog/logging.h>

#include <folly/Exception.h>
#include <folly/Format.h>
#include <folly/FileUtil.h>
#include <folly/String.h>
#include <folly/gen/Base.h>
#include <folly/gen/File.h>
#include <folly/gen/String.h>
#include <folly/experimental/TestUtil.h>
#include <folly/experimental/io/FsUtil.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Unistd.h>

FOLLY_GCC_DISABLE_WARNING(deprecated-declarations)

using namespace folly;

TEST(SimpleSubprocessTest, ExitsSuccessfully) {
  Subprocess proc(std::vector<std::string>{ "/bin/true" });
  EXPECT_EQ(0, proc.wait().exitStatus());
}

TEST(SimpleSubprocessTest, ExitsSuccessfullyChecked) {
  Subprocess proc(std::vector<std::string>{ "/bin/true" });
  proc.waitChecked();
}

TEST(SimpleSubprocessTest, ExitsWithError) {
  Subprocess proc(std::vector<std::string>{ "/bin/false" });
  EXPECT_EQ(1, proc.wait().exitStatus());
}

TEST(SimpleSubprocessTest, ExitsWithErrorChecked) {
  Subprocess proc(std::vector<std::string>{ "/bin/false" });
  EXPECT_THROW(proc.waitChecked(), CalledProcessError);
}

TEST(SimpleSubprocessTest, DefaultConstructibleProcessReturnCode) {
  ProcessReturnCode retcode;
  EXPECT_TRUE(retcode.notStarted());
}

TEST(SimpleSubprocessTest, MoveSubprocess) {
  Subprocess old_proc(std::vector<std::string>{ "/bin/true" });
  EXPECT_TRUE(old_proc.returnCode().running());
  auto new_proc = std::move(old_proc);
  EXPECT_TRUE(old_proc.returnCode().notStarted());
  EXPECT_TRUE(new_proc.returnCode().running());
  EXPECT_EQ(0, new_proc.wait().exitStatus());
  // Now old_proc is destroyed, but we don't crash.
}

TEST(SimpleSubprocessTest, DefaultConstructor) {
  Subprocess proc;
  EXPECT_TRUE(proc.returnCode().notStarted());

  {
    auto p1 = Subprocess(std::vector<std::string>{"/bin/true"});
    proc = std::move(p1);
  }

  EXPECT_TRUE(proc.returnCode().running());
  EXPECT_EQ(0, proc.wait().exitStatus());
}

#define EXPECT_SPAWN_ERROR(err, errMsg, cmd, ...) \
  do { \
    try { \
      Subprocess proc(std::vector<std::string>{ (cmd), ## __VA_ARGS__ }); \
      ADD_FAILURE() << "expected an error when running " << (cmd); \
    } catch (const SubprocessSpawnError& ex) { \
      EXPECT_EQ((err), ex.errnoValue()); \
      if (StringPiece(ex.what()).find(errMsg) == StringPiece::npos) { \
        ADD_FAILURE() << "failed to find \"" << (errMsg) << \
          "\" in exception: \"" << ex.what() << "\""; \
      } \
    } \
  } while (0)

TEST(SimpleSubprocessTest, ExecFails) {
  EXPECT_SPAWN_ERROR(ENOENT, "failed to execute /no/such/file:",
                     "/no/such/file");
  EXPECT_SPAWN_ERROR(EACCES, "failed to execute /etc/passwd:",
                     "/etc/passwd");
  EXPECT_SPAWN_ERROR(ENOTDIR, "failed to execute /etc/passwd/not/a/file:",
                     "/etc/passwd/not/a/file");
}

TEST(SimpleSubprocessTest, ShellExitsSuccesssfully) {
  Subprocess proc("true");
  EXPECT_EQ(0, proc.wait().exitStatus());
}

TEST(SimpleSubprocessTest, ShellExitsWithError) {
  Subprocess proc("false");
  EXPECT_EQ(1, proc.wait().exitStatus());
}

TEST(SimpleSubprocessTest, ChangeChildDirectorySuccessfully) {
  // The filesystem root normally lacks a 'true' binary
  EXPECT_EQ(0, chdir("/"));
  EXPECT_SPAWN_ERROR(ENOENT, "failed to execute ./true", "./true");
  // The child can fix that by moving to /bin before exec().
  Subprocess proc("./true", Subprocess::Options().chdir("/bin"));
  EXPECT_EQ(0, proc.wait().exitStatus());
}

TEST(SimpleSubprocessTest, ChangeChildDirectoryWithError) {
  try {
    Subprocess proc(
      std::vector<std::string>{"/bin/true"},
      Subprocess::Options().chdir("/usually/this/is/not/a/valid/directory/")
    );
    ADD_FAILURE() << "expected to fail when changing the child's directory";
  } catch (const SubprocessSpawnError& ex) {
    EXPECT_EQ(ENOENT, ex.errnoValue());
    const std::string expectedError =
      "error preparing to execute /bin/true: No such file or directory";
    if (StringPiece(ex.what()).find(expectedError) == StringPiece::npos) {
      ADD_FAILURE() << "failed to find \"" << expectedError <<
        "\" in exception: \"" << ex.what() << "\"";
    }
  }
}

namespace {
boost::container::flat_set<int> getOpenFds() {
  auto pid = getpid();
  auto dirname = to<std::string>("/proc/", pid, "/fd");

  boost::container::flat_set<int> fds;
  for (fs::directory_iterator it(dirname);
       it != fs::directory_iterator();
       ++it) {
    int fd = to<int>(it->path().filename().native());
    fds.insert(fd);
  }
  return fds;
}

template<class Runnable>
void checkFdLeak(const Runnable& r) {
  // Get the currently open fds.  Check that they are the same both before and
  // after calling the specified function.  We read the open fds from /proc.
  // (If we wanted to work even on systems that don't have /proc, we could
  // perhaps create and immediately close a socket both before and after
  // running the function, and make sure we got the same fd number both times.)
  auto fdsBefore = getOpenFds();
  r();
  auto fdsAfter = getOpenFds();
  EXPECT_EQ(fdsAfter.size(), fdsBefore.size());
}
}

// Make sure Subprocess doesn't leak any file descriptors
TEST(SimpleSubprocessTest, FdLeakTest) {
  // Normal execution
  checkFdLeak([] {
    Subprocess proc("true");
    EXPECT_EQ(0, proc.wait().exitStatus());
  });
  // Normal execution with pipes
  checkFdLeak([] {
    Subprocess proc("echo foo; echo bar >&2",
                    Subprocess::pipeStdout() | Subprocess::pipeStderr());
    auto p = proc.communicate();
    EXPECT_EQ("foo\n", p.first);
    EXPECT_EQ("bar\n", p.second);
    proc.waitChecked();
  });

  // Test where the exec call fails()
  checkFdLeak([] {
    EXPECT_SPAWN_ERROR(ENOENT, "failed to execute", "/no/such/file");
  });
  // Test where the exec call fails() with pipes
  checkFdLeak([] {
    try {
      Subprocess proc(std::vector<std::string>({"/no/such/file"}),
                      Subprocess::pipeStdout().stderrFd(Subprocess::PIPE));
      ADD_FAILURE() << "expected an error when running /no/such/file";
    } catch (const SubprocessSpawnError& ex) {
      EXPECT_EQ(ENOENT, ex.errnoValue());
    }
  });
}

TEST(ParentDeathSubprocessTest, ParentDeathSignal) {
  // Find out where we are.
  const auto basename = "subprocess_test_parent_death_helper";
  auto helper = fs::executable_path();
  helper.remove_filename() /= basename;
  if (!fs::exists(helper)) {
    helper = helper.parent_path().parent_path() / basename / basename;
  }

  fs::path tempFile(fs::temp_directory_path() / fs::unique_path());

  std::vector<std::string> args {helper.string(), tempFile.string()};
  Subprocess proc(args);
  // The helper gets killed by its child, see details in
  // SubprocessTestParentDeathHelper.cpp
  ASSERT_EQ(SIGKILL, proc.wait().killSignal());

  // Now wait for the file to be created, see details in
  // SubprocessTestParentDeathHelper.cpp
  while (!fs::exists(tempFile)) {
    usleep(20000);  // 20ms
  }

  fs::remove(tempFile);
}

TEST(PopenSubprocessTest, PopenRead) {
  Subprocess proc("ls /", Subprocess::pipeStdout());
  int found = 0;
  gen::byLine(File(proc.stdoutFd())) |
    [&] (StringPiece line) {
      if (line == "etc" || line == "bin" || line == "usr") {
        ++found;
      }
    };
  EXPECT_EQ(3, found);
  proc.waitChecked();
}

// DANGER: This class runs after fork in a child processes. Be fast, the
// parent thread is waiting, but remember that other parent threads are
// running and may mutate your state.  Avoid mutating any data belonging to
// the parent.  Avoid interacting with non-POD data that originated in the
// parent.  Avoid any libraries that may internally reference non-POD data.
// Especially beware parent mutexes -- for example, glog's LOG() uses one.
struct WriteFileAfterFork
    : public Subprocess::DangerousPostForkPreExecCallback {
  explicit WriteFileAfterFork(std::string filename)
    : filename_(std::move(filename)) {}
  virtual ~WriteFileAfterFork() {}
  int operator()() override {
    return writeFile(std::string("ok"), filename_.c_str()) ? 0 : errno;
  }
  const std::string filename_;
};

TEST(AfterForkCallbackSubprocessTest, TestAfterForkCallbackSuccess) {
  test::ChangeToTempDir td;
  // Trigger a file write from the child.
  WriteFileAfterFork write_cob("good_file");
  Subprocess proc(
    std::vector<std::string>{"/bin/echo"},
    Subprocess::Options().dangerousPostForkPreExecCallback(&write_cob)
  );
  // The file gets written immediately.
  std::string s;
  EXPECT_TRUE(readFile(write_cob.filename_.c_str(), s));
  EXPECT_EQ("ok", s);
  proc.waitChecked();
}

TEST(AfterForkCallbackSubprocessTest, TestAfterForkCallbackError) {
  test::ChangeToTempDir td;
  // The child will try to write to a file, whose directory does not exist.
  WriteFileAfterFork write_cob("bad/file");
  EXPECT_THROW(
    Subprocess proc(
      std::vector<std::string>{"/bin/echo"},
      Subprocess::Options().dangerousPostForkPreExecCallback(&write_cob)
    ),
    SubprocessSpawnError
  );
  EXPECT_FALSE(fs::exists(write_cob.filename_));
}

TEST(CommunicateSubprocessTest, SimpleRead) {
  Subprocess proc(std::vector<std::string>{ "/bin/echo", "-n", "foo", "bar"},
                  Subprocess::pipeStdout());
  auto p = proc.communicate();
  EXPECT_EQ("foo bar", p.first);
  proc.waitChecked();
}

TEST(CommunicateSubprocessTest, BigWrite) {
  const int numLines = 1 << 20;
  std::string line("hello\n");
  std::string data;
  data.reserve(numLines * line.size());
  for (int i = 0; i < numLines; ++i) {
    data.append(line);
  }

  Subprocess proc("wc -l", Subprocess::pipeStdin() | Subprocess::pipeStdout());
  auto p = proc.communicate(data);
  EXPECT_EQ(folly::format("{}\n", numLines).str(), p.first);
  proc.waitChecked();
}

TEST(CommunicateSubprocessTest, Duplex) {
  // Take 10MB of data and pass them through a filter.
  // One line, as tr is line-buffered
  const int bytes = 10 << 20;
  std::string line(bytes, 'x');

  Subprocess proc("tr a-z A-Z",
                  Subprocess::pipeStdin() | Subprocess::pipeStdout());
  auto p = proc.communicate(line);
  EXPECT_EQ(bytes, p.first.size());
  EXPECT_EQ(std::string::npos, p.first.find_first_not_of('X'));
  proc.waitChecked();
}

TEST(CommunicateSubprocessTest, ProcessGroupLeader) {
  const auto testIsLeader = "test $(cut -d ' ' -f 5 /proc/$$/stat) = $$";
  Subprocess nonLeader(testIsLeader);
  EXPECT_THROW(nonLeader.waitChecked(), CalledProcessError);
  Subprocess leader(testIsLeader, Subprocess::Options().processGroupLeader());
  leader.waitChecked();
}

TEST(CommunicateSubprocessTest, Duplex2) {
  checkFdLeak([] {
    // Pipe 200,000 lines through sed
    const size_t numCopies = 100000;
    auto iobuf = IOBuf::copyBuffer("this is a test\nanother line\n");
    IOBufQueue input;
    for (size_t n = 0; n < numCopies; ++n) {
      input.append(iobuf->clone());
    }

    std::vector<std::string> cmd({
      "sed", "-u",
      "-e", "s/a test/a successful test/",
      "-e", "/^another line/w/dev/stderr",
    });
    auto options = Subprocess::pipeStdin().pipeStdout().pipeStderr().usePath();
    Subprocess proc(cmd, options);
    auto out = proc.communicateIOBuf(std::move(input));
    proc.waitChecked();

    // Convert stdout and stderr to strings so we can call split() on them.
    fbstring stdoutStr;
    if (out.first.front()) {
      stdoutStr = out.first.move()->moveToFbString();
    }
    fbstring stderrStr;
    if (out.second.front()) {
      stderrStr = out.second.move()->moveToFbString();
    }

    // stdout should be a copy of stdin, with "a test" replaced by
    // "a successful test"
    std::vector<StringPiece> stdoutLines;
    split('\n', stdoutStr, stdoutLines);
    EXPECT_EQ(numCopies * 2 + 1, stdoutLines.size());
    // Strip off the trailing empty line
    if (!stdoutLines.empty()) {
      EXPECT_EQ("", stdoutLines.back());
      stdoutLines.pop_back();
    }
    size_t linenum = 0;
    for (const auto& line : stdoutLines) {
      if ((linenum & 1) == 0) {
        EXPECT_EQ("this is a successful test", line);
      } else {
        EXPECT_EQ("another line", line);
      }
      ++linenum;
    }

    // stderr should only contain the lines containing "another line"
    std::vector<StringPiece> stderrLines;
    split('\n', stderrStr, stderrLines);
    EXPECT_EQ(numCopies + 1, stderrLines.size());
    // Strip off the trailing empty line
    if (!stderrLines.empty()) {
      EXPECT_EQ("", stderrLines.back());
      stderrLines.pop_back();
    }
    for (const auto& line : stderrLines) {
      EXPECT_EQ("another line", line);
    }
  });
}

namespace {

bool readToString(int fd, std::string& buf, size_t maxSize) {
  buf.resize(maxSize);
  char* dest = &buf.front();
  size_t remaining = maxSize;

  ssize_t n = -1;
  while (remaining) {
    n = ::read(fd, dest, remaining);
    if (n == -1) {
      if (errno == EINTR) {
        continue;
      }
      if (errno == EAGAIN) {
        break;
      }
      PCHECK("read failed");
    } else if (n == 0) {
      break;
    }
    dest += n;
    remaining -= n;
  }

  buf.resize(dest - buf.data());
  return (n == 0);
}

}  // namespace

TEST(CommunicateSubprocessTest, Chatty) {
  checkFdLeak([] {
    const int lineCount = 1000;

    int wcount = 0;
    int rcount = 0;

    auto options = Subprocess::pipeStdin().pipeStdout().pipeStderr().usePath();
    std::vector<std::string> cmd {
      "sed",
      "-u",
      "-e",
      "s/a test/a successful test/",
    };

    Subprocess proc(cmd, options);

    auto writeCallback = [&] (int pfd, int cfd) -> bool {
      EXPECT_EQ(0, cfd);  // child stdin
      EXPECT_EQ(rcount, wcount);  // chatty, one read for every write

      auto msg = folly::to<std::string>("a test ", wcount, "\n");

      // Not entirely kosher, we should handle partial writes, but this is
      // fine for writes <= PIPE_BUF
      EXPECT_EQ(msg.size(), writeFull(pfd, msg.data(), msg.size()));

      ++wcount;
      proc.enableNotifications(0, false);

      return (wcount == lineCount);
    };

    bool eofSeen = false;

    auto readCallback = [&] (int pfd, int cfd) -> bool {
      std::string lineBuf;

      if (cfd != 1) {
        EXPECT_EQ(2, cfd);
        EXPECT_TRUE(readToString(pfd, lineBuf, 1));
        EXPECT_EQ(0, lineBuf.size());
        return true;
      }

      EXPECT_FALSE(eofSeen);

      std::string expected;

      if (rcount < lineCount) {
        expected = folly::to<std::string>("a successful test ", rcount++, "\n");
      }

      EXPECT_EQ(wcount, rcount);

      // Not entirely kosher, we should handle partial reads, but this is
      // fine for reads <= PIPE_BUF
      bool atEof = readToString(pfd, lineBuf, expected.size() + 1);
      if (atEof) {
        // EOF only expected after we finished reading
        EXPECT_EQ(lineCount, rcount);
        eofSeen = true;
      }

      EXPECT_EQ(expected, lineBuf);

      if (wcount != lineCount) {  // still more to write...
        proc.enableNotifications(0, true);
      }

      return eofSeen;
    };

    proc.communicate(readCallback, writeCallback);

    EXPECT_EQ(lineCount, wcount);
    EXPECT_EQ(lineCount, rcount);
    EXPECT_TRUE(eofSeen);

    EXPECT_EQ(0, proc.wait().exitStatus());
  });
}

TEST(CommunicateSubprocessTest, TakeOwnershipOfPipes) {
  std::vector<Subprocess::ChildPipe> pipes;
  {
    Subprocess proc(
      "echo $'oh\\nmy\\ncat' | wc -l &", Subprocess::pipeStdout()
    );
    pipes = proc.takeOwnershipOfPipes();
    proc.waitChecked();
  }
  EXPECT_EQ(1, pipes.size());
  EXPECT_EQ(1, pipes[0].childFd);

  char buf[10];
  EXPECT_EQ(2, readFull(pipes[0].pipe.fd(), buf, 10));
  buf[2] = 0;
  EXPECT_EQ("3\n", std::string(buf));
}
