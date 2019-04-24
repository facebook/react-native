/*
 * Copyright 2012-present Facebook, Inc.
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

#ifndef _GNU_SOURCE
#define _GNU_SOURCE
#endif

#include <folly/Subprocess.h>

#if __linux__
#include <sys/prctl.h>
#endif
#include <fcntl.h>

#include <algorithm>
#include <array>
#include <system_error>

#include <boost/container/flat_set.hpp>
#include <boost/range/adaptors.hpp>

#include <glog/logging.h>

#include <folly/Conv.h>
#include <folly/Exception.h>
#include <folly/ScopeGuard.h>
#include <folly/String.h>
#include <folly/io/Cursor.h>
#include <folly/lang/Assume.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/Stdlib.h>
#include <folly/portability/SysSyscall.h>
#include <folly/portability/Unistd.h>
#include <folly/system/Shell.h>

constexpr int kExecFailure = 127;
constexpr int kChildFailure = 126;

namespace folly {

ProcessReturnCode ProcessReturnCode::make(int status) {
  if (!WIFEXITED(status) && !WIFSIGNALED(status)) {
    throw std::runtime_error(
        to<std::string>("Invalid ProcessReturnCode: ", status));
  }
  return ProcessReturnCode(status);
}

ProcessReturnCode::ProcessReturnCode(ProcessReturnCode&& p) noexcept
    : rawStatus_(p.rawStatus_) {
  p.rawStatus_ = ProcessReturnCode::RV_NOT_STARTED;
}

ProcessReturnCode& ProcessReturnCode::operator=(
    ProcessReturnCode&& p) noexcept {
  rawStatus_ = p.rawStatus_;
  p.rawStatus_ = ProcessReturnCode::RV_NOT_STARTED;
  return *this;
}

ProcessReturnCode::State ProcessReturnCode::state() const {
  if (rawStatus_ == RV_NOT_STARTED) {
    return NOT_STARTED;
  }
  if (rawStatus_ == RV_RUNNING) {
    return RUNNING;
  }
  if (WIFEXITED(rawStatus_)) {
    return EXITED;
  }
  if (WIFSIGNALED(rawStatus_)) {
    return KILLED;
  }
  assume_unreachable();
}

void ProcessReturnCode::enforce(State expected) const {
  State s = state();
  if (s != expected) {
    throw std::logic_error(to<std::string>(
        "Bad use of ProcessReturnCode; state is ", s, " expected ", expected));
  }
}

int ProcessReturnCode::exitStatus() const {
  enforce(EXITED);
  return WEXITSTATUS(rawStatus_);
}

int ProcessReturnCode::killSignal() const {
  enforce(KILLED);
  return WTERMSIG(rawStatus_);
}

bool ProcessReturnCode::coreDumped() const {
  enforce(KILLED);
  return WCOREDUMP(rawStatus_);
}

std::string ProcessReturnCode::str() const {
  switch (state()) {
    case NOT_STARTED:
      return "not started";
    case RUNNING:
      return "running";
    case EXITED:
      return to<std::string>("exited with status ", exitStatus());
    case KILLED:
      return to<std::string>(
          "killed by signal ",
          killSignal(),
          (coreDumped() ? " (core dumped)" : ""));
  }
  assume_unreachable();
}

CalledProcessError::CalledProcessError(ProcessReturnCode rc)
    : SubprocessError(rc.str()), returnCode_(rc) {}

static inline std::string toSubprocessSpawnErrorMessage(
    char const* executable,
    int errCode,
    int errnoValue) {
  auto prefix = errCode == kExecFailure ? "failed to execute "
                                        : "error preparing to execute ";
  return to<std::string>(prefix, executable, ": ", errnoStr(errnoValue));
}

SubprocessSpawnError::SubprocessSpawnError(
    const char* executable,
    int errCode,
    int errnoValue)
    : SubprocessError(
          toSubprocessSpawnErrorMessage(executable, errCode, errnoValue)),
      errnoValue_(errnoValue) {}

namespace {

// Copy pointers to the given strings in a format suitable for posix_spawn
std::unique_ptr<const char* []> cloneStrings(
    const std::vector<std::string>& s) {
  std::unique_ptr<const char*[]> d(new const char*[s.size() + 1]);
  for (size_t i = 0; i < s.size(); i++) {
    d[i] = s[i].c_str();
  }
  d[s.size()] = nullptr;
  return d;
}

// Check a wait() status, throw on non-successful
void checkStatus(ProcessReturnCode returnCode) {
  if (returnCode.state() != ProcessReturnCode::EXITED ||
      returnCode.exitStatus() != 0) {
    throw CalledProcessError(returnCode);
  }
}

} // namespace

Subprocess::Options& Subprocess::Options::fd(int fd, int action) {
  if (action == Subprocess::PIPE) {
    if (fd == 0) {
      action = Subprocess::PIPE_IN;
    } else if (fd == 1 || fd == 2) {
      action = Subprocess::PIPE_OUT;
    } else {
      throw std::invalid_argument(
          to<std::string>("Only fds 0, 1, 2 are valid for action=PIPE: ", fd));
    }
  }
  fdActions_[fd] = action;
  return *this;
}

Subprocess::Subprocess() {}

Subprocess::Subprocess(
    const std::vector<std::string>& argv,
    const Options& options,
    const char* executable,
    const std::vector<std::string>* env) {
  if (argv.empty()) {
    throw std::invalid_argument("argv must not be empty");
  }
  if (!executable) {
    executable = argv[0].c_str();
  }
  spawn(cloneStrings(argv), executable, options, env);
}

Subprocess::Subprocess(
    const std::string& cmd,
    const Options& options,
    const std::vector<std::string>* env) {
  if (options.usePath_) {
    throw std::invalid_argument("usePath() not allowed when running in shell");
  }

  std::vector<std::string> argv = {"/bin/sh", "-c", cmd};
  spawn(cloneStrings(argv), argv[0].c_str(), options, env);
}

Subprocess::~Subprocess() {
  CHECK_NE(returnCode_.state(), ProcessReturnCode::RUNNING)
      << "Subprocess destroyed without reaping child";
}

namespace {

struct ChildErrorInfo {
  int errCode;
  int errnoValue;
};

[[noreturn]] void childError(int errFd, int errCode, int errnoValue) {
  ChildErrorInfo info = {errCode, errnoValue};
  // Write the error information over the pipe to our parent process.
  // We can't really do anything else if this write call fails.
  writeNoInt(errFd, &info, sizeof(info));
  // exit
  _exit(errCode);
}

} // namespace

void Subprocess::setAllNonBlocking() {
  for (auto& p : pipes_) {
    int fd = p.pipe.fd();
    int flags = ::fcntl(fd, F_GETFL);
    checkUnixError(flags, "fcntl");
    int r = ::fcntl(fd, F_SETFL, flags | O_NONBLOCK);
    checkUnixError(r, "fcntl");
  }
}

void Subprocess::spawn(
    std::unique_ptr<const char*[]> argv,
    const char* executable,
    const Options& optionsIn,
    const std::vector<std::string>* env) {
  if (optionsIn.usePath_ && env) {
    throw std::invalid_argument(
        "usePath() not allowed when overriding environment");
  }

  // Make a copy, we'll mutate options
  Options options(optionsIn);

  // On error, close all pipes_ (ignoring errors, but that seems fine here).
  auto pipesGuard = makeGuard([this] { pipes_.clear(); });

  // Create a pipe to use to receive error information from the child,
  // in case it fails before calling exec()
  int errFds[2];
#if FOLLY_HAVE_PIPE2
  checkUnixError(::pipe2(errFds, O_CLOEXEC), "pipe2");
#else
  checkUnixError(::pipe(errFds), "pipe");
#endif
  SCOPE_EXIT {
    CHECK_ERR(::close(errFds[0]));
    if (errFds[1] >= 0) {
      CHECK_ERR(::close(errFds[1]));
    }
  };

#if !FOLLY_HAVE_PIPE2
  // Ask the child to close the read end of the error pipe.
  checkUnixError(fcntl(errFds[0], F_SETFD, FD_CLOEXEC), "set FD_CLOEXEC");
  // Set the close-on-exec flag on the write side of the pipe.
  // This way the pipe will be closed automatically in the child if execve()
  // succeeds.  If the exec fails the child can write error information to the
  // pipe.
  checkUnixError(fcntl(errFds[1], F_SETFD, FD_CLOEXEC), "set FD_CLOEXEC");
#endif

  // Perform the actual work of setting up pipes then forking and
  // executing the child.
  spawnInternal(std::move(argv), executable, options, env, errFds[1]);

  // After spawnInternal() returns the child is alive.  We have to be very
  // careful about throwing after this point.  We are inside the constructor,
  // so if we throw the Subprocess object will have never existed, and the
  // destructor will never be called.
  //
  // We should only throw if we got an error via the errFd, and we know the
  // child has exited and can be immediately waited for.  In all other cases,
  // we have no way of cleaning up the child.

  // Close writable side of the errFd pipe in the parent process
  CHECK_ERR(::close(errFds[1]));
  errFds[1] = -1;

  // Read from the errFd pipe, to tell if the child ran into any errors before
  // calling exec()
  readChildErrorPipe(errFds[0], executable);

  // We have fully succeeded now, so release the guard on pipes_
  pipesGuard.dismiss();
}

// With -Wclobbered, gcc complains about vfork potentially cloberring the
// childDir variable, even though we only use it on the child side of the
// vfork.

FOLLY_PUSH_WARNING
FOLLY_GCC_DISABLE_WARNING("-Wclobbered")
void Subprocess::spawnInternal(
    std::unique_ptr<const char*[]> argv,
    const char* executable,
    Options& options,
    const std::vector<std::string>* env,
    int errFd) {
  // Parent work, pre-fork: create pipes
  std::vector<int> childFds;
  // Close all of the childFds as we leave this scope
  SCOPE_EXIT {
    // These are only pipes, closing them shouldn't fail
    for (int cfd : childFds) {
      CHECK_ERR(::close(cfd));
    }
  };

  int r;
  for (auto& p : options.fdActions_) {
    if (p.second == PIPE_IN || p.second == PIPE_OUT) {
      int fds[2];
      // We're setting both ends of the pipe as close-on-exec. The child
      // doesn't need to reset the flag on its end, as we always dup2() the fd,
      // and dup2() fds don't share the close-on-exec flag.
#if FOLLY_HAVE_PIPE2
      // If possible, set close-on-exec atomically. Otherwise, a concurrent
      // Subprocess invocation can fork() between "pipe" and "fnctl",
      // causing FDs to leak.
      r = ::pipe2(fds, O_CLOEXEC);
      checkUnixError(r, "pipe2");
#else
      r = ::pipe(fds);
      checkUnixError(r, "pipe");
      r = fcntl(fds[0], F_SETFD, FD_CLOEXEC);
      checkUnixError(r, "set FD_CLOEXEC");
      r = fcntl(fds[1], F_SETFD, FD_CLOEXEC);
      checkUnixError(r, "set FD_CLOEXEC");
#endif
      pipes_.emplace_back();
      Pipe& pipe = pipes_.back();
      pipe.direction = p.second;
      int cfd;
      if (p.second == PIPE_IN) {
        // Child gets reading end
        pipe.pipe = folly::File(fds[1], /*ownsFd=*/true);
        cfd = fds[0];
      } else {
        pipe.pipe = folly::File(fds[0], /*ownsFd=*/true);
        cfd = fds[1];
      }
      p.second = cfd; // ensure it gets dup2()ed
      pipe.childFd = p.first;
      childFds.push_back(cfd);
    }
  }

  // This should already be sorted, as options.fdActions_ is
  DCHECK(std::is_sorted(pipes_.begin(), pipes_.end()));

  // Note that the const casts below are legit, per
  // http://pubs.opengroup.org/onlinepubs/009695399/functions/exec.html

  char** argVec = const_cast<char**>(argv.get());

  // Set up environment
  std::unique_ptr<const char*[]> envHolder;
  char** envVec;
  if (env) {
    envHolder = cloneStrings(*env);
    envVec = const_cast<char**>(envHolder.get());
  } else {
    envVec = environ;
  }

  // Block all signals around vfork; see http://ewontfix.com/7/.
  //
  // As the child may run in the same address space as the parent until
  // the actual execve() system call, any (custom) signal handlers that
  // the parent has might alter parent's memory if invoked in the child,
  // with undefined results.  So we block all signals in the parent before
  // vfork(), which will cause them to be blocked in the child as well (we
  // rely on the fact that Linux, just like all sane implementations, only
  // clones the calling thread).  Then, in the child, we reset all signals
  // to their default dispositions (while still blocked), and unblock them
  // (so the exec()ed process inherits the parent's signal mask)
  //
  // The parent also unblocks all signals as soon as vfork() returns.
  sigset_t allBlocked;
  r = sigfillset(&allBlocked);
  checkUnixError(r, "sigfillset");
  sigset_t oldSignals;

  r = pthread_sigmask(SIG_SETMASK, &allBlocked, &oldSignals);
  checkPosixError(r, "pthread_sigmask");
  SCOPE_EXIT {
    // Restore signal mask
    r = pthread_sigmask(SIG_SETMASK, &oldSignals, nullptr);
    CHECK_EQ(r, 0) << "pthread_sigmask: " << errnoStr(r); // shouldn't fail
  };

  // Call c_str() here, as it's not necessarily safe after fork.
  const char* childDir =
      options.childDir_.empty() ? nullptr : options.childDir_.c_str();

  pid_t pid;
#ifdef __linux__
  if (options.cloneFlags_) {
    pid = syscall(SYS_clone, *options.cloneFlags_, 0, nullptr, nullptr);
    checkUnixError(pid, errno, "clone");
  } else {
#endif
    pid = vfork();
    checkUnixError(pid, errno, "vfork");
#ifdef __linux__
  }
#endif
  if (pid == 0) {
    int errnoValue = prepareChild(options, &oldSignals, childDir);
    if (errnoValue != 0) {
      childError(errFd, kChildFailure, errnoValue);
    }

    errnoValue = runChild(executable, argVec, envVec, options);
    // If we get here, exec() failed.
    childError(errFd, kExecFailure, errnoValue);
  }

  // Child is alive.  We have to be very careful about throwing after this
  // point.  We are inside the constructor, so if we throw the Subprocess
  // object will have never existed, and the destructor will never be called.
  //
  // We should only throw if we got an error via the errFd, and we know the
  // child has exited and can be immediately waited for.  In all other cases,
  // we have no way of cleaning up the child.
  pid_ = pid;
  returnCode_ = ProcessReturnCode::makeRunning();
}
FOLLY_POP_WARNING

int Subprocess::prepareChild(
    const Options& options,
    const sigset_t* sigmask,
    const char* childDir) const {
  // While all signals are blocked, we must reset their
  // dispositions to default.
  for (int sig = 1; sig < NSIG; ++sig) {
    ::signal(sig, SIG_DFL);
  }

  {
    // Unblock signals; restore signal mask.
    int r = pthread_sigmask(SIG_SETMASK, sigmask, nullptr);
    if (r != 0) {
      return r; // pthread_sigmask() returns an errno value
    }
  }

  // Change the working directory, if one is given
  if (childDir) {
    if (::chdir(childDir) == -1) {
      return errno;
    }
  }

  // We don't have to explicitly close the parent's end of all pipes,
  // as they all have the FD_CLOEXEC flag set and will be closed at
  // exec time.

  // Close all fds that we're supposed to close.
  for (auto& p : options.fdActions_) {
    if (p.second == CLOSE) {
      if (::close(p.first) == -1) {
        return errno;
      }
    } else if (p.second != p.first) {
      if (::dup2(p.second, p.first) == -1) {
        return errno;
      }
    }
  }

  // If requested, close all other file descriptors.  Don't close
  // any fds in options.fdActions_, and don't touch stdin, stdout, stderr.
  // Ignore errors.
  if (options.closeOtherFds_) {
    for (int fd = getdtablesize() - 1; fd >= 3; --fd) {
      if (options.fdActions_.count(fd) == 0) {
        ::close(fd);
      }
    }
  }

#if __linux__
  // Opt to receive signal on parent death, if requested
  if (options.parentDeathSignal_ != 0) {
    const auto parentDeathSignal =
        static_cast<unsigned long>(options.parentDeathSignal_);
    if (prctl(PR_SET_PDEATHSIG, parentDeathSignal, 0, 0, 0) == -1) {
      return errno;
    }
  }
#endif

  if (options.processGroupLeader_) {
    if (setpgrp() == -1) {
      return errno;
    }
  }

  // The user callback comes last, so that the child is otherwise all set up.
  if (options.dangerousPostForkPreExecCallback_) {
    if (int error = (*options.dangerousPostForkPreExecCallback_)()) {
      return error;
    }
  }

  return 0;
}

int Subprocess::runChild(
    const char* executable,
    char** argv,
    char** env,
    const Options& options) const {
  // Now, finally, exec.
  if (options.usePath_) {
    ::execvp(executable, argv);
  } else {
    ::execve(executable, argv, env);
  }
  return errno;
}

void Subprocess::readChildErrorPipe(int pfd, const char* executable) {
  ChildErrorInfo info;
  auto rc = readNoInt(pfd, &info, sizeof(info));
  if (rc == 0) {
    // No data means the child executed successfully, and the pipe
    // was closed due to the close-on-exec flag being set.
    return;
  } else if (rc != sizeof(ChildErrorInfo)) {
    // An error occurred trying to read from the pipe, or we got a partial read.
    // Neither of these cases should really occur in practice.
    //
    // We can't get any error data from the child in this case, and we don't
    // know if it is successfully running or not.  All we can do is to return
    // normally, as if the child executed successfully.  If something bad
    // happened the caller should at least get a non-normal exit status from
    // the child.
    LOG(ERROR) << "unexpected error trying to read from child error pipe "
               << "rc=" << rc << ", errno=" << errno;
    return;
  }

  // We got error data from the child.  The child should exit immediately in
  // this case, so wait on it to clean up.
  wait();

  // Throw to signal the error
  throw SubprocessSpawnError(executable, info.errCode, info.errnoValue);
}

ProcessReturnCode Subprocess::poll(struct rusage* ru) {
  returnCode_.enforce(ProcessReturnCode::RUNNING);
  DCHECK_GT(pid_, 0);
  int status;
  pid_t found = ::wait4(pid_, &status, WNOHANG, ru);
  // The spec guarantees that EINTR does not occur with WNOHANG, so the only
  // two remaining errors are ECHILD (other code reaped the child?), or
  // EINVAL (cosmic rays?), both of which merit an abort:
  PCHECK(found != -1) << "waitpid(" << pid_ << ", &status, WNOHANG)";
  if (found != 0) {
    // Though the child process had quit, this call does not close the pipes
    // since its descendants may still be using them.
    returnCode_ = ProcessReturnCode::make(status);
    pid_ = -1;
  }
  return returnCode_;
}

bool Subprocess::pollChecked() {
  if (poll().state() == ProcessReturnCode::RUNNING) {
    return false;
  }
  checkStatus(returnCode_);
  return true;
}

ProcessReturnCode Subprocess::wait() {
  returnCode_.enforce(ProcessReturnCode::RUNNING);
  DCHECK_GT(pid_, 0);
  int status;
  pid_t found;
  do {
    found = ::waitpid(pid_, &status, 0);
  } while (found == -1 && errno == EINTR);
  // The only two remaining errors are ECHILD (other code reaped the
  // child?), or EINVAL (cosmic rays?), and both merit an abort:
  PCHECK(found != -1) << "waitpid(" << pid_ << ", &status, WNOHANG)";
  // Though the child process had quit, this call does not close the pipes
  // since its descendants may still be using them.
  DCHECK_EQ(found, pid_);
  returnCode_ = ProcessReturnCode::make(status);
  pid_ = -1;
  return returnCode_;
}

void Subprocess::waitChecked() {
  wait();
  checkStatus(returnCode_);
}

void Subprocess::sendSignal(int signal) {
  returnCode_.enforce(ProcessReturnCode::RUNNING);
  int r = ::kill(pid_, signal);
  checkUnixError(r, "kill");
}

pid_t Subprocess::pid() const {
  return pid_;
}

namespace {

ByteRange queueFront(const IOBufQueue& queue) {
  auto* p = queue.front();
  if (!p) {
    return ByteRange{};
  }
  return io::Cursor(p).peekBytes();
}

// fd write
bool handleWrite(int fd, IOBufQueue& queue) {
  for (;;) {
    auto b = queueFront(queue);
    if (b.empty()) {
      return true; // EOF
    }

    ssize_t n = writeNoInt(fd, b.data(), b.size());
    if (n == -1 && errno == EAGAIN) {
      return false;
    }
    checkUnixError(n, "write");
    queue.trimStart(n);
  }
}

// fd read
bool handleRead(int fd, IOBufQueue& queue) {
  for (;;) {
    auto p = queue.preallocate(100, 65000);
    ssize_t n = readNoInt(fd, p.first, p.second);
    if (n == -1 && errno == EAGAIN) {
      return false;
    }
    checkUnixError(n, "read");
    if (n == 0) {
      return true;
    }
    queue.postallocate(n);
  }
}

bool discardRead(int fd) {
  static const size_t bufSize = 65000;
  // Thread unsafe, but it doesn't matter.
  static std::unique_ptr<char[]> buf(new char[bufSize]);

  for (;;) {
    ssize_t n = readNoInt(fd, buf.get(), bufSize);
    if (n == -1 && errno == EAGAIN) {
      return false;
    }
    checkUnixError(n, "read");
    if (n == 0) {
      return true;
    }
  }
}

} // namespace

std::pair<std::string, std::string> Subprocess::communicate(StringPiece input) {
  IOBufQueue inputQueue;
  inputQueue.wrapBuffer(input.data(), input.size());

  auto outQueues = communicateIOBuf(std::move(inputQueue));
  auto outBufs =
      std::make_pair(outQueues.first.move(), outQueues.second.move());
  std::pair<std::string, std::string> out;
  if (outBufs.first) {
    outBufs.first->coalesce();
    out.first.assign(
        reinterpret_cast<const char*>(outBufs.first->data()),
        outBufs.first->length());
  }
  if (outBufs.second) {
    outBufs.second->coalesce();
    out.second.assign(
        reinterpret_cast<const char*>(outBufs.second->data()),
        outBufs.second->length());
  }
  return out;
}

std::pair<IOBufQueue, IOBufQueue> Subprocess::communicateIOBuf(
    IOBufQueue input) {
  // If the user supplied a non-empty input buffer, make sure
  // that stdin is a pipe so we can write the data.
  if (!input.empty()) {
    // findByChildFd() will throw std::invalid_argument if no pipe for
    // STDIN_FILENO exists
    findByChildFd(STDIN_FILENO);
  }

  std::pair<IOBufQueue, IOBufQueue> out;

  auto readCallback = [&](int pfd, int cfd) -> bool {
    if (cfd == STDOUT_FILENO) {
      return handleRead(pfd, out.first);
    } else if (cfd == STDERR_FILENO) {
      return handleRead(pfd, out.second);
    } else {
      // Don't close the file descriptor, the child might not like SIGPIPE,
      // just read and throw the data away.
      return discardRead(pfd);
    }
  };

  auto writeCallback = [&](int pfd, int cfd) -> bool {
    if (cfd == STDIN_FILENO) {
      return handleWrite(pfd, input);
    } else {
      // If we don't want to write to this fd, just close it.
      return true;
    }
  };

  communicate(std::move(readCallback), std::move(writeCallback));

  return out;
}

void Subprocess::communicate(
    FdCallback readCallback,
    FdCallback writeCallback) {
  // This serves to prevent wait() followed by communicate(), but if you
  // legitimately need that, send a patch to delete this line.
  returnCode_.enforce(ProcessReturnCode::RUNNING);
  setAllNonBlocking();

  std::vector<pollfd> fds;
  fds.reserve(pipes_.size());
  std::vector<size_t> toClose; // indexes into pipes_
  toClose.reserve(pipes_.size());

  while (!pipes_.empty()) {
    fds.clear();
    toClose.clear();

    for (auto& p : pipes_) {
      pollfd pfd;
      pfd.fd = p.pipe.fd();
      // Yes, backwards, PIPE_IN / PIPE_OUT are defined from the
      // child's point of view.
      if (!p.enabled) {
        // Still keeping fd in watched set so we get notified of POLLHUP /
        // POLLERR
        pfd.events = 0;
      } else if (p.direction == PIPE_IN) {
        pfd.events = POLLOUT;
      } else {
        pfd.events = POLLIN;
      }
      fds.push_back(pfd);
    }

    int r;
    do {
      r = ::poll(fds.data(), fds.size(), -1);
    } while (r == -1 && errno == EINTR);
    checkUnixError(r, "poll");

    for (size_t i = 0; i < pipes_.size(); ++i) {
      auto& p = pipes_[i];
      auto parentFd = p.pipe.fd();
      DCHECK_EQ(fds[i].fd, parentFd);
      short events = fds[i].revents;

      bool closed = false;
      if (events & POLLOUT) {
        DCHECK(!(events & POLLIN));
        if (writeCallback(parentFd, p.childFd)) {
          toClose.push_back(i);
          closed = true;
        }
      }

      // Call read callback on POLLHUP, to give it a chance to read (and act
      // on) end of file
      if (events & (POLLIN | POLLHUP)) {
        DCHECK(!(events & POLLOUT));
        if (readCallback(parentFd, p.childFd)) {
          toClose.push_back(i);
          closed = true;
        }
      }

      if ((events & (POLLHUP | POLLERR)) && !closed) {
        toClose.push_back(i);
        closed = true;
      }
    }

    // Close the fds in reverse order so the indexes hold after erase()
    for (int idx : boost::adaptors::reverse(toClose)) {
      auto pos = pipes_.begin() + idx;
      pos->pipe.close(); // Throws on error
      pipes_.erase(pos);
    }
  }
}

void Subprocess::enableNotifications(int childFd, bool enabled) {
  pipes_[findByChildFd(childFd)].enabled = enabled;
}

bool Subprocess::notificationsEnabled(int childFd) const {
  return pipes_[findByChildFd(childFd)].enabled;
}

size_t Subprocess::findByChildFd(int childFd) const {
  auto pos = std::lower_bound(
      pipes_.begin(), pipes_.end(), childFd, [](const Pipe& pipe, int fd) {
        return pipe.childFd < fd;
      });
  if (pos == pipes_.end() || pos->childFd != childFd) {
    throw std::invalid_argument(
        folly::to<std::string>("child fd not found ", childFd));
  }
  return pos - pipes_.begin();
}

void Subprocess::closeParentFd(int childFd) {
  int idx = findByChildFd(childFd);
  pipes_[idx].pipe.close(); // May throw
  pipes_.erase(pipes_.begin() + idx);
}

std::vector<Subprocess::ChildPipe> Subprocess::takeOwnershipOfPipes() {
  std::vector<Subprocess::ChildPipe> pipes;
  for (auto& p : pipes_) {
    pipes.emplace_back(p.childFd, std::move(p.pipe));
  }
  // release memory
  std::vector<Pipe>().swap(pipes_);
  return pipes;
}

namespace {

class Initializer {
 public:
  Initializer() {
    // We like EPIPE, thanks.
    ::signal(SIGPIPE, SIG_IGN);
  }
};

Initializer initializer;

} // namespace

} // namespace folly
