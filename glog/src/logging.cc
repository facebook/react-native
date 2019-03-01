// Copyright (c) 1999, Google Inc.
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

#define _GNU_SOURCE 1 // needed for O_NOFOLLOW and pread()/pwrite()

#include "utilities.h"

#include <algorithm>
#include <assert.h>
#include <iomanip>
#include <string>
#ifdef HAVE_UNISTD_H
# include <unistd.h>  // For _exit.
#endif
#include <climits>
#include <sys/types.h>
#include <sys/stat.h>
#ifdef HAVE_SYS_UTSNAME_H
# include <sys/utsname.h>  // For uname.
#endif
#include <fcntl.h>
#include <cstdio>
#include <iostream>
#include <stdarg.h>
#include <stdlib.h>
#ifdef HAVE_PWD_H
# include <pwd.h>
#endif
#ifdef HAVE_SYSLOG_H
# include <syslog.h>
#endif
#include <vector>
#include <errno.h>                   // for errno
#include <sstream>
#include "base/commandlineflags.h"        // to get the program name
#include "glog/logging.h"
#include "glog/raw_logging.h"
#include "base/googleinit.h"

#ifdef HAVE_STACKTRACE
# include "stacktrace.h"
#endif

using std::string;
using std::vector;
using std::setw;
using std::setfill;
using std::hex;
using std::dec;
using std::min;
using std::ostream;
using std::ostringstream;

using std::FILE;
using std::fwrite;
using std::fclose;
using std::fflush;
using std::fprintf;
using std::perror;

#ifdef __QNX__
using std::fdopen;
#endif

#ifdef _WIN32
#define fdopen _fdopen
#endif

// There is no thread annotation support.
#define EXCLUSIVE_LOCKS_REQUIRED(mu)

static bool BoolFromEnv(const char *varname, bool defval) {
  const char* const valstr = getenv(varname);
  if (!valstr) {
    return defval;
  }
  return memchr("tTyY1\0", valstr[0], 6) != NULL;
}

GLOG_DEFINE_bool(logtostderr, BoolFromEnv("GOOGLE_LOGTOSTDERR", false),
                 "log messages go to stderr instead of logfiles");
GLOG_DEFINE_bool(alsologtostderr, BoolFromEnv("GOOGLE_ALSOLOGTOSTDERR", false),
                 "log messages go to stderr in addition to logfiles");
GLOG_DEFINE_bool(colorlogtostderr, false,
                 "color messages logged to stderr (if supported by terminal)");
#ifdef OS_LINUX
GLOG_DEFINE_bool(drop_log_memory, true, "Drop in-memory buffers of log contents. "
                 "Logs can grow very quickly and they are rarely read before they "
                 "need to be evicted from memory. Instead, drop them from memory "
                 "as soon as they are flushed to disk.");
#endif

// By default, errors (including fatal errors) get logged to stderr as
// well as the file.
//
// The default is ERROR instead of FATAL so that users can see problems
// when they run a program without having to look in another file.
DEFINE_int32(stderrthreshold,
             GOOGLE_NAMESPACE::GLOG_ERROR,
             "log messages at or above this level are copied to stderr in "
             "addition to logfiles.  This flag obsoletes --alsologtostderr.");

GLOG_DEFINE_string(alsologtoemail, "",
                   "log messages go to these email addresses "
                   "in addition to logfiles");
GLOG_DEFINE_bool(log_prefix, true,
                 "Prepend the log prefix to the start of each log line");
GLOG_DEFINE_int32(minloglevel, 0, "Messages logged at a lower level than this don't "
                  "actually get logged anywhere");
GLOG_DEFINE_int32(logbuflevel, 0,
                  "Buffer log messages logged at this level or lower"
                  " (-1 means don't buffer; 0 means buffer INFO only;"
                  " ...)");
GLOG_DEFINE_int32(logbufsecs, 30,
                  "Buffer log messages for at most this many seconds");
GLOG_DEFINE_int32(logemaillevel, 999,
                  "Email log messages logged at this level or higher"
                  " (0 means email all; 3 means email FATAL only;"
                  " ...)");
GLOG_DEFINE_string(logmailer, "/bin/mail",
                   "Mailer used to send logging email");

// Compute the default value for --log_dir
static const char* DefaultLogDir() {
  const char* env;
  env = getenv("GOOGLE_LOG_DIR");
  if (env != NULL && env[0] != '\0') {
    return env;
  }
  env = getenv("TEST_TMPDIR");
  if (env != NULL && env[0] != '\0') {
    return env;
  }
  return "";
}

GLOG_DEFINE_int32(logfile_mode, 0664, "Log file mode/permissions.");

GLOG_DEFINE_string(log_dir, DefaultLogDir(),
                   "If specified, logfiles are written into this directory instead "
                   "of the default logging directory.");
GLOG_DEFINE_string(log_link, "", "Put additional links to the log "
                   "files in this directory");

GLOG_DEFINE_int32(max_log_size, 1800,
                  "approx. maximum log file size (in MB). A value of 0 will "
                  "be silently overridden to 1.");

GLOG_DEFINE_bool(stop_logging_if_full_disk, false,
                 "Stop attempting to log to disk if the disk is full.");

GLOG_DEFINE_string(log_backtrace_at, "",
                   "Emit a backtrace when logging at file:linenum.");

// TODO(hamaji): consider windows
#define PATH_SEPARATOR '/'

#ifndef HAVE_PREAD
#if defined(OS_WINDOWS)
#include <BaseTsd.h>
#define ssize_t SSIZE_T
#endif
static ssize_t pread(int fd, void* buf, size_t count, off_t offset) {
  off_t orig_offset = lseek(fd, 0, SEEK_CUR);
  if (orig_offset == (off_t)-1)
    return -1;
  if (lseek(fd, offset, SEEK_CUR) == (off_t)-1)
    return -1;
  ssize_t len = read(fd, buf, count);
  if (len < 0)
    return len;
  if (lseek(fd, orig_offset, SEEK_SET) == (off_t)-1)
    return -1;
  return len;
}
#endif  // !HAVE_PREAD

#ifndef HAVE_PWRITE
static ssize_t pwrite(int fd, void* buf, size_t count, off_t offset) {
  off_t orig_offset = lseek(fd, 0, SEEK_CUR);
  if (orig_offset == (off_t)-1)
    return -1;
  if (lseek(fd, offset, SEEK_CUR) == (off_t)-1)
    return -1;
  ssize_t len = write(fd, buf, count);
  if (len < 0)
    return len;
  if (lseek(fd, orig_offset, SEEK_SET) == (off_t)-1)
    return -1;
  return len;
}
#endif  // !HAVE_PWRITE

static void GetHostName(string* hostname) {
#if defined(HAVE_SYS_UTSNAME_H)
  struct utsname buf;
  if (0 != uname(&buf)) {
    // ensure null termination on failure
    *buf.nodename = '\0';
  }
  *hostname = buf.nodename;
#elif defined(OS_WINDOWS)
  char buf[MAX_COMPUTERNAME_LENGTH + 1];
  DWORD len = MAX_COMPUTERNAME_LENGTH + 1;
  if (GetComputerNameA(buf, &len)) {
    *hostname = buf;
  } else {
    hostname->clear();
  }
#else
# warning There is no way to retrieve the host name.
  *hostname = "(unknown)";
#endif
}

// Returns true iff terminal supports using colors in output.
static bool TerminalSupportsColor() {
  bool term_supports_color = false;
#ifdef OS_WINDOWS
  // on Windows TERM variable is usually not set, but the console does
  // support colors.
  term_supports_color = true;
#else
  // On non-Windows platforms, we rely on the TERM variable.
  const char* const term = getenv("TERM");
  if (term != NULL && term[0] != '\0') {
    term_supports_color =
      !strcmp(term, "xterm") ||
      !strcmp(term, "xterm-color") ||
      !strcmp(term, "xterm-256color") ||
      !strcmp(term, "screen-256color") ||
      !strcmp(term, "screen") ||
      !strcmp(term, "linux") ||
      !strcmp(term, "cygwin");
  }
#endif
  return term_supports_color;
}

_START_GOOGLE_NAMESPACE_

enum GLogColor {
  COLOR_DEFAULT,
  COLOR_RED,
  COLOR_GREEN,
  COLOR_YELLOW
};

static GLogColor SeverityToColor(LogSeverity severity) {
  assert(severity >= 0 && severity < NUM_SEVERITIES);
  GLogColor color = COLOR_DEFAULT;
  switch (severity) {
  case GLOG_INFO:
    color = COLOR_DEFAULT;
    break;
  case GLOG_WARNING:
    color = COLOR_YELLOW;
    break;
  case GLOG_ERROR:
  case GLOG_FATAL:
    color = COLOR_RED;
    break;
  default:
    // should never get here.
    assert(false);
  }
  return color;
}

#ifdef OS_WINDOWS

// Returns the character attribute for the given color.
WORD GetColorAttribute(GLogColor color) {
  switch (color) {
    case COLOR_RED:    return FOREGROUND_RED;
    case COLOR_GREEN:  return FOREGROUND_GREEN;
    case COLOR_YELLOW: return FOREGROUND_RED | FOREGROUND_GREEN;
    default:           return 0;
  }
}

#else

// Returns the ANSI color code for the given color.
const char* GetAnsiColorCode(GLogColor color) {
  switch (color) {
  case COLOR_RED:     return "1";
  case COLOR_GREEN:   return "2";
  case COLOR_YELLOW:  return "3";
  case COLOR_DEFAULT:  return "";
  };
  return NULL; // stop warning about return type.
}

#endif  // OS_WINDOWS

// Safely get max_log_size, overriding to 1 if it somehow gets defined as 0
static int32 MaxLogSize() {
  return (FLAGS_max_log_size > 0 ? FLAGS_max_log_size : 1);
}

// An arbitrary limit on the length of a single log message.  This
// is so that streaming can be done more efficiently.
const size_t LogMessage::kMaxLogMessageLen = 30000;

struct LogMessage::LogMessageData  {
  LogMessageData();

  int preserved_errno_;      // preserved errno
  // Buffer space; contains complete message text.
  char message_text_[LogMessage::kMaxLogMessageLen+1];
  LogStream stream_;
  char severity_;      // What level is this LogMessage logged at?
  int line_;                 // line number where logging call is.
  void (LogMessage::*send_method_)();  // Call this in destructor to send
  union {  // At most one of these is used: union to keep the size low.
    LogSink* sink_;             // NULL or sink to send message to
    std::vector<std::string>* outvec_; // NULL or vector to push message onto
    std::string* message_;             // NULL or string to write message into
  };
  time_t timestamp_;            // Time of creation of LogMessage
  struct ::tm tm_time_;         // Time of creation of LogMessage
  size_t num_prefix_chars_;     // # of chars of prefix in this message
  size_t num_chars_to_log_;     // # of chars of msg to send to log
  size_t num_chars_to_syslog_;  // # of chars of msg to send to syslog
  const char* basename_;        // basename of file that called LOG
  const char* fullname_;        // fullname of file that called LOG
  bool has_been_flushed_;       // false => data has not been flushed
  bool first_fatal_;            // true => this was first fatal msg

 private:
  LogMessageData(const LogMessageData&);
  void operator=(const LogMessageData&);
};

// A mutex that allows only one thread to log at a time, to keep things from
// getting jumbled.  Some other very uncommon logging operations (like
// changing the destination file for log messages of a given severity) also
// lock this mutex.  Please be sure that anybody who might possibly need to
// lock it does so.
static Mutex log_mutex;

// Number of messages sent at each severity.  Under log_mutex.
int64 LogMessage::num_messages_[NUM_SEVERITIES] = {0, 0, 0, 0};

// Globally disable log writing (if disk is full)
static bool stop_writing = false;

const char*const LogSeverityNames[NUM_SEVERITIES] = {
  "INFO", "WARNING", "ERROR", "FATAL"
};

// Has the user called SetExitOnDFatal(true)?
static bool exit_on_dfatal = true;

const char* GetLogSeverityName(LogSeverity severity) {
  return LogSeverityNames[severity];
}

static bool SendEmailInternal(const char*dest, const char *subject,
                              const char*body, bool use_logging);

base::Logger::~Logger() {
}

namespace {

// Encapsulates all file-system related state
class LogFileObject : public base::Logger {
 public:
  LogFileObject(LogSeverity severity, const char* base_filename);
  ~LogFileObject();

  virtual void Write(bool force_flush, // Should we force a flush here?
                     time_t timestamp,  // Timestamp for this entry
                     const char* message,
                     int message_len);

  // Configuration options
  void SetBasename(const char* basename);
  void SetExtension(const char* ext);
  void SetSymlinkBasename(const char* symlink_basename);

  // Normal flushing routine
  virtual void Flush();

  // It is the actual file length for the system loggers,
  // i.e., INFO, ERROR, etc.
  virtual uint32 LogSize() {
    MutexLock l(&lock_);
    return file_length_;
  }

  // Internal flush routine.  Exposed so that FlushLogFilesUnsafe()
  // can avoid grabbing a lock.  Usually Flush() calls it after
  // acquiring lock_.
  void FlushUnlocked();

 private:
  static const uint32 kRolloverAttemptFrequency = 0x20;

  Mutex lock_;
  bool base_filename_selected_;
  string base_filename_;
  string symlink_basename_;
  string filename_extension_;     // option users can specify (eg to add port#)
  FILE* file_;
  LogSeverity severity_;
  uint32 bytes_since_flush_;
  uint32 dropped_mem_length_;
  uint32 file_length_;
  unsigned int rollover_attempt_;
  int64 next_flush_time_;         // cycle count at which to flush log

  // Actually create a logfile using the value of base_filename_ and the
  // supplied argument time_pid_string
  // REQUIRES: lock_ is held
  bool CreateLogfile(const string& time_pid_string);
};

}  // namespace

class LogDestination {
 public:
  friend class LogMessage;
  friend void ReprintFatalMessage();
  friend base::Logger* base::GetLogger(LogSeverity);
  friend void base::SetLogger(LogSeverity, base::Logger*);

  // These methods are just forwarded to by their global versions.
  static void SetLogDestination(LogSeverity severity,
				const char* base_filename);
  static void SetLogSymlink(LogSeverity severity,
                            const char* symlink_basename);
  static void AddLogSink(LogSink *destination);
  static void RemoveLogSink(LogSink *destination);
  static void SetLogFilenameExtension(const char* filename_extension);
  static void SetStderrLogging(LogSeverity min_severity);
  static void SetEmailLogging(LogSeverity min_severity, const char* addresses);
  static void LogToStderr();
  // Flush all log files that are at least at the given severity level
  static void FlushLogFiles(int min_severity);
  static void FlushLogFilesUnsafe(int min_severity);

  // we set the maximum size of our packet to be 1400, the logic being
  // to prevent fragmentation.
  // Really this number is arbitrary.
  static const int kNetworkBytes = 1400;

  static const string& hostname();
  static const bool& terminal_supports_color() {
    return terminal_supports_color_;
  }

  static void DeleteLogDestinations();

 private:
  LogDestination(LogSeverity severity, const char* base_filename);
  ~LogDestination() { }

  // Take a log message of a particular severity and log it to stderr
  // iff it's of a high enough severity to deserve it.
  static void MaybeLogToStderr(LogSeverity severity, const char* message,
			       size_t len);

  // Take a log message of a particular severity and log it to email
  // iff it's of a high enough severity to deserve it.
  static void MaybeLogToEmail(LogSeverity severity, const char* message,
			      size_t len);
  // Take a log message of a particular severity and log it to a file
  // iff the base filename is not "" (which means "don't log to me")
  static void MaybeLogToLogfile(LogSeverity severity,
                                time_t timestamp,
				const char* message, size_t len);
  // Take a log message of a particular severity and log it to the file
  // for that severity and also for all files with severity less than
  // this severity.
  static void LogToAllLogfiles(LogSeverity severity,
                               time_t timestamp,
                               const char* message, size_t len);

  // Send logging info to all registered sinks.
  static void LogToSinks(LogSeverity severity,
                         const char *full_filename,
                         const char *base_filename,
                         int line,
                         const struct ::tm* tm_time,
                         const char* message,
                         size_t message_len);

  // Wait for all registered sinks via WaitTillSent
  // including the optional one in "data".
  static void WaitForSinks(LogMessage::LogMessageData* data);

  static LogDestination* log_destination(LogSeverity severity);

  LogFileObject fileobject_;
  base::Logger* logger_;      // Either &fileobject_, or wrapper around it

  static LogDestination* log_destinations_[NUM_SEVERITIES];
  static LogSeverity email_logging_severity_;
  static string addresses_;
  static string hostname_;
  static bool terminal_supports_color_;

  // arbitrary global logging destinations.
  static vector<LogSink*>* sinks_;

  // Protects the vector sinks_,
  // but not the LogSink objects its elements reference.
  static Mutex sink_mutex_;

  // Disallow
  LogDestination(const LogDestination&);
  LogDestination& operator=(const LogDestination&);
};

// Errors do not get logged to email by default.
LogSeverity LogDestination::email_logging_severity_ = 99999;

string LogDestination::addresses_;
string LogDestination::hostname_;

vector<LogSink*>* LogDestination::sinks_ = NULL;
Mutex LogDestination::sink_mutex_;
bool LogDestination::terminal_supports_color_ = TerminalSupportsColor();

/* static */
const string& LogDestination::hostname() {
  if (hostname_.empty()) {
    GetHostName(&hostname_);
    if (hostname_.empty()) {
      hostname_ = "(unknown)";
    }
  }
  return hostname_;
}

LogDestination::LogDestination(LogSeverity severity,
                               const char* base_filename)
  : fileobject_(severity, base_filename),
    logger_(&fileobject_) {
}

inline void LogDestination::FlushLogFilesUnsafe(int min_severity) {
  // assume we have the log_mutex or we simply don't care
  // about it
  for (int i = min_severity; i < NUM_SEVERITIES; i++) {
    LogDestination* log = log_destinations_[i];
    if (log != NULL) {
      // Flush the base fileobject_ logger directly instead of going
      // through any wrappers to reduce chance of deadlock.
      log->fileobject_.FlushUnlocked();
    }
  }
}

inline void LogDestination::FlushLogFiles(int min_severity) {
  // Prevent any subtle race conditions by wrapping a mutex lock around
  // all this stuff.
  MutexLock l(&log_mutex);
  for (int i = min_severity; i < NUM_SEVERITIES; i++) {
    LogDestination* log = log_destination(i);
    if (log != NULL) {
      log->logger_->Flush();
    }
  }
}

inline void LogDestination::SetLogDestination(LogSeverity severity,
					      const char* base_filename) {
  assert(severity >= 0 && severity < NUM_SEVERITIES);
  // Prevent any subtle race conditions by wrapping a mutex lock around
  // all this stuff.
  MutexLock l(&log_mutex);
  log_destination(severity)->fileobject_.SetBasename(base_filename);
}

inline void LogDestination::SetLogSymlink(LogSeverity severity,
                                          const char* symlink_basename) {
  CHECK_GE(severity, 0);
  CHECK_LT(severity, NUM_SEVERITIES);
  MutexLock l(&log_mutex);
  log_destination(severity)->fileobject_.SetSymlinkBasename(symlink_basename);
}

inline void LogDestination::AddLogSink(LogSink *destination) {
  // Prevent any subtle race conditions by wrapping a mutex lock around
  // all this stuff.
  MutexLock l(&sink_mutex_);
  if (!sinks_)  sinks_ = new vector<LogSink*>;
  sinks_->push_back(destination);
}

inline void LogDestination::RemoveLogSink(LogSink *destination) {
  // Prevent any subtle race conditions by wrapping a mutex lock around
  // all this stuff.
  MutexLock l(&sink_mutex_);
  // This doesn't keep the sinks in order, but who cares?
  if (sinks_) {
    for (int i = sinks_->size() - 1; i >= 0; i--) {
      if ((*sinks_)[i] == destination) {
        (*sinks_)[i] = (*sinks_)[sinks_->size() - 1];
        sinks_->pop_back();
        break;
      }
    }
  }
}

inline void LogDestination::SetLogFilenameExtension(const char* ext) {
  // Prevent any subtle race conditions by wrapping a mutex lock around
  // all this stuff.
  MutexLock l(&log_mutex);
  for ( int severity = 0; severity < NUM_SEVERITIES; ++severity ) {
    log_destination(severity)->fileobject_.SetExtension(ext);
  }
}

inline void LogDestination::SetStderrLogging(LogSeverity min_severity) {
  assert(min_severity >= 0 && min_severity < NUM_SEVERITIES);
  // Prevent any subtle race conditions by wrapping a mutex lock around
  // all this stuff.
  MutexLock l(&log_mutex);
  FLAGS_stderrthreshold = min_severity;
}

inline void LogDestination::LogToStderr() {
  // *Don't* put this stuff in a mutex lock, since SetStderrLogging &
  // SetLogDestination already do the locking!
  SetStderrLogging(0);            // thus everything is "also" logged to stderr
  for ( int i = 0; i < NUM_SEVERITIES; ++i ) {
    SetLogDestination(i, "");     // "" turns off logging to a logfile
  }
}

inline void LogDestination::SetEmailLogging(LogSeverity min_severity,
					    const char* addresses) {
  assert(min_severity >= 0 && min_severity < NUM_SEVERITIES);
  // Prevent any subtle race conditions by wrapping a mutex lock around
  // all this stuff.
  MutexLock l(&log_mutex);
  LogDestination::email_logging_severity_ = min_severity;
  LogDestination::addresses_ = addresses;
}

static void ColoredWriteToStderr(LogSeverity severity,
                                 const char* message, size_t len) {
  const GLogColor color =
      (LogDestination::terminal_supports_color() && FLAGS_colorlogtostderr) ?
      SeverityToColor(severity) : COLOR_DEFAULT;

  // Avoid using cerr from this module since we may get called during
  // exit code, and cerr may be partially or fully destroyed by then.
  if (COLOR_DEFAULT == color) {
    fwrite(message, len, 1, stderr);
    return;
  }
#ifdef OS_WINDOWS
  const HANDLE stderr_handle = GetStdHandle(STD_ERROR_HANDLE);

  // Gets the current text color.
  CONSOLE_SCREEN_BUFFER_INFO buffer_info;
  GetConsoleScreenBufferInfo(stderr_handle, &buffer_info);
  const WORD old_color_attrs = buffer_info.wAttributes;

  // We need to flush the stream buffers into the console before each
  // SetConsoleTextAttribute call lest it affect the text that is already
  // printed but has not yet reached the console.
  fflush(stderr);
  SetConsoleTextAttribute(stderr_handle,
                          GetColorAttribute(color) | FOREGROUND_INTENSITY);
  fwrite(message, len, 1, stderr);
  fflush(stderr);
  // Restores the text color.
  SetConsoleTextAttribute(stderr_handle, old_color_attrs);
#else
  fprintf(stderr, "\033[0;3%sm", GetAnsiColorCode(color));
  fwrite(message, len, 1, stderr);
  fprintf(stderr, "\033[m");  // Resets the terminal to default.
#endif  // OS_WINDOWS
}

static void WriteToStderr(const char* message, size_t len) {
  // Avoid using cerr from this module since we may get called during
  // exit code, and cerr may be partially or fully destroyed by then.
  fwrite(message, len, 1, stderr);
}

inline void LogDestination::MaybeLogToStderr(LogSeverity severity,
					     const char* message, size_t len) {
  if ((severity >= FLAGS_stderrthreshold) || FLAGS_alsologtostderr) {
    ColoredWriteToStderr(severity, message, len);
#ifdef OS_WINDOWS
    // On Windows, also output to the debugger
    ::OutputDebugStringA(string(message,len).c_str());
#endif
  }
}


inline void LogDestination::MaybeLogToEmail(LogSeverity severity,
					    const char* message, size_t len) {
  if (severity >= email_logging_severity_ ||
      severity >= FLAGS_logemaillevel) {
    string to(FLAGS_alsologtoemail);
    if (!addresses_.empty()) {
      if (!to.empty()) {
        to += ",";
      }
      to += addresses_;
    }
    const string subject(string("[LOG] ") + LogSeverityNames[severity] + ": " +
                         glog_internal_namespace_::ProgramInvocationShortName());
    string body(hostname());
    body += "\n\n";
    body.append(message, len);

    // should NOT use SendEmail().  The caller of this function holds the
    // log_mutex and SendEmail() calls LOG/VLOG which will block trying to
    // acquire the log_mutex object.  Use SendEmailInternal() and set
    // use_logging to false.
    SendEmailInternal(to.c_str(), subject.c_str(), body.c_str(), false);
  }
}


inline void LogDestination::MaybeLogToLogfile(LogSeverity severity,
                                              time_t timestamp,
					      const char* message,
					      size_t len) {
  const bool should_flush = severity > FLAGS_logbuflevel;
  LogDestination* destination = log_destination(severity);
  destination->logger_->Write(should_flush, timestamp, message, len);
}

inline void LogDestination::LogToAllLogfiles(LogSeverity severity,
                                             time_t timestamp,
                                             const char* message,
                                             size_t len) {

  if ( FLAGS_logtostderr ) {           // global flag: never log to file
    ColoredWriteToStderr(severity, message, len);
  } else {
    for (int i = severity; i >= 0; --i)
      LogDestination::MaybeLogToLogfile(i, timestamp, message, len);
  }
}

inline void LogDestination::LogToSinks(LogSeverity severity,
                                       const char *full_filename,
                                       const char *base_filename,
                                       int line,
                                       const struct ::tm* tm_time,
                                       const char* message,
                                       size_t message_len) {
  ReaderMutexLock l(&sink_mutex_);
  if (sinks_) {
    for (int i = sinks_->size() - 1; i >= 0; i--) {
      (*sinks_)[i]->send(severity, full_filename, base_filename,
                         line, tm_time, message, message_len);
    }
  }
}

inline void LogDestination::WaitForSinks(LogMessage::LogMessageData* data) {
  ReaderMutexLock l(&sink_mutex_);
  if (sinks_) {
    for (int i = sinks_->size() - 1; i >= 0; i--) {
      (*sinks_)[i]->WaitTillSent();
    }
  }
  const bool send_to_sink =
      (data->send_method_ == &LogMessage::SendToSink) ||
      (data->send_method_ == &LogMessage::SendToSinkAndLog);
  if (send_to_sink && data->sink_ != NULL) {
    data->sink_->WaitTillSent();
  }
}

LogDestination* LogDestination::log_destinations_[NUM_SEVERITIES];

inline LogDestination* LogDestination::log_destination(LogSeverity severity) {
  assert(severity >=0 && severity < NUM_SEVERITIES);
  if (!log_destinations_[severity]) {
    log_destinations_[severity] = new LogDestination(severity, NULL);
  }
  return log_destinations_[severity];
}

void LogDestination::DeleteLogDestinations() {
  for (int severity = 0; severity < NUM_SEVERITIES; ++severity) {
    delete log_destinations_[severity];
    log_destinations_[severity] = NULL;
  }
  MutexLock l(&sink_mutex_);
  delete sinks_;
  sinks_ = NULL;
}

namespace {

LogFileObject::LogFileObject(LogSeverity severity,
                             const char* base_filename)
  : base_filename_selected_(base_filename != NULL),
    base_filename_((base_filename != NULL) ? base_filename : ""),
    symlink_basename_(glog_internal_namespace_::ProgramInvocationShortName()),
    filename_extension_(),
    file_(NULL),
    severity_(severity),
    bytes_since_flush_(0),
    dropped_mem_length_(0),
    file_length_(0),
    rollover_attempt_(kRolloverAttemptFrequency-1),
    next_flush_time_(0) {
  assert(severity >= 0);
  assert(severity < NUM_SEVERITIES);
}

LogFileObject::~LogFileObject() {
  MutexLock l(&lock_);
  if (file_ != NULL) {
    fclose(file_);
    file_ = NULL;
  }
}

void LogFileObject::SetBasename(const char* basename) {
  MutexLock l(&lock_);
  base_filename_selected_ = true;
  if (base_filename_ != basename) {
    // Get rid of old log file since we are changing names
    if (file_ != NULL) {
      fclose(file_);
      file_ = NULL;
      rollover_attempt_ = kRolloverAttemptFrequency-1;
    }
    base_filename_ = basename;
  }
}

void LogFileObject::SetExtension(const char* ext) {
  MutexLock l(&lock_);
  if (filename_extension_ != ext) {
    // Get rid of old log file since we are changing names
    if (file_ != NULL) {
      fclose(file_);
      file_ = NULL;
      rollover_attempt_ = kRolloverAttemptFrequency-1;
    }
    filename_extension_ = ext;
  }
}

void LogFileObject::SetSymlinkBasename(const char* symlink_basename) {
  MutexLock l(&lock_);
  symlink_basename_ = symlink_basename;
}

void LogFileObject::Flush() {
  MutexLock l(&lock_);
  FlushUnlocked();
}

void LogFileObject::FlushUnlocked(){
  if (file_ != NULL) {
    fflush(file_);
    bytes_since_flush_ = 0;
  }
  // Figure out when we are due for another flush.
  const int64 next = (FLAGS_logbufsecs
                      * static_cast<int64>(1000000));  // in usec
  next_flush_time_ = CycleClock_Now() + UsecToCycles(next);
}

bool LogFileObject::CreateLogfile(const string& time_pid_string) {
  string string_filename = base_filename_+filename_extension_+
                           time_pid_string;
  const char* filename = string_filename.c_str();
  int fd = open(filename, O_WRONLY | O_CREAT | O_EXCL, FLAGS_logfile_mode);
  if (fd == -1) return false;
#ifdef HAVE_FCNTL
  // Mark the file close-on-exec. We don't really care if this fails
  fcntl(fd, F_SETFD, FD_CLOEXEC);
#endif

  file_ = fdopen(fd, "a");  // Make a FILE*.
  if (file_ == NULL) {  // Man, we're screwed!
    close(fd);
    unlink(filename);  // Erase the half-baked evidence: an unusable log file
    return false;
  }

  // We try to create a symlink called <program_name>.<severity>,
  // which is easier to use.  (Every time we create a new logfile,
  // we destroy the old symlink and create a new one, so it always
  // points to the latest logfile.)  If it fails, we're sad but it's
  // no error.
  if (!symlink_basename_.empty()) {
    // take directory from filename
    const char* slash = strrchr(filename, PATH_SEPARATOR);
    const string linkname =
      symlink_basename_ + '.' + LogSeverityNames[severity_];
    string linkpath;
    if ( slash ) linkpath = string(filename, slash-filename+1);  // get dirname
    linkpath += linkname;
    unlink(linkpath.c_str());                    // delete old one if it exists

#if defined(OS_WINDOWS)
    // TODO(hamaji): Create lnk file on Windows?
#elif defined(HAVE_UNISTD_H)
    // We must have unistd.h.
    // Make the symlink be relative (in the same dir) so that if the
    // entire log directory gets relocated the link is still valid.
    const char *linkdest = slash ? (slash + 1) : filename;
    if (symlink(linkdest, linkpath.c_str()) != 0) {
      // silently ignore failures
    }

    // Make an additional link to the log file in a place specified by
    // FLAGS_log_link, if indicated
    if (!FLAGS_log_link.empty()) {
      linkpath = FLAGS_log_link + "/" + linkname;
      unlink(linkpath.c_str());                  // delete old one if it exists
      if (symlink(filename, linkpath.c_str()) != 0) {
        // silently ignore failures
      }
    }
#endif
  }

  return true;  // Everything worked
}

void LogFileObject::Write(bool force_flush,
                          time_t timestamp,
                          const char* message,
                          int message_len) {
  MutexLock l(&lock_);

  // We don't log if the base_name_ is "" (which means "don't write")
  if (base_filename_selected_ && base_filename_.empty()) {
    return;
  }

  if (static_cast<int>(file_length_ >> 20) >= MaxLogSize() ||
      PidHasChanged()) {
    if (file_ != NULL) fclose(file_);
    file_ = NULL;
    file_length_ = bytes_since_flush_ = dropped_mem_length_ = 0;
    rollover_attempt_ = kRolloverAttemptFrequency-1;
  }

  // If there's no destination file, make one before outputting
  if (file_ == NULL) {
    // Try to rollover the log file every 32 log messages.  The only time
    // this could matter would be when we have trouble creating the log
    // file.  If that happens, we'll lose lots of log messages, of course!
    if (++rollover_attempt_ != kRolloverAttemptFrequency) return;
    rollover_attempt_ = 0;

    struct ::tm tm_time;
    localtime_r(&timestamp, &tm_time);

    // The logfile's filename will have the date/time & pid in it
    ostringstream time_pid_stream;
    time_pid_stream.fill('0');
    time_pid_stream << 1900+tm_time.tm_year
                    << setw(2) << 1+tm_time.tm_mon
                    << setw(2) << tm_time.tm_mday
                    << '-'
                    << setw(2) << tm_time.tm_hour
                    << setw(2) << tm_time.tm_min
                    << setw(2) << tm_time.tm_sec
                    << '.'
                    << GetMainThreadPid();
    const string& time_pid_string = time_pid_stream.str();

    if (base_filename_selected_) {
      if (!CreateLogfile(time_pid_string)) {
        perror("Could not create log file");
        fprintf(stderr, "COULD NOT CREATE LOGFILE '%s'!\n",
                time_pid_string.c_str());
        return;
      }
    } else {
      // If no base filename for logs of this severity has been set, use a
      // default base filename of
      // "<program name>.<hostname>.<user name>.log.<severity level>.".  So
      // logfiles will have names like
      // webserver.examplehost.root.log.INFO.19990817-150000.4354, where
      // 19990817 is a date (1999 August 17), 150000 is a time (15:00:00),
      // and 4354 is the pid of the logging process.  The date & time reflect
      // when the file was created for output.
      //
      // Where does the file get put?  Successively try the directories
      // "/tmp", and "."
      string stripped_filename(
          glog_internal_namespace_::ProgramInvocationShortName());
      string hostname;
      GetHostName(&hostname);

      string uidname = MyUserName();
      // We should not call CHECK() here because this function can be
      // called after holding on to log_mutex. We don't want to
      // attempt to hold on to the same mutex, and get into a
      // deadlock. Simply use a name like invalid-user.
      if (uidname.empty()) uidname = "invalid-user";

      stripped_filename = stripped_filename+'.'+hostname+'.'
                          +uidname+".log."
                          +LogSeverityNames[severity_]+'.';
      // We're going to (potentially) try to put logs in several different dirs
      const vector<string> & log_dirs = GetLoggingDirectories();

      // Go through the list of dirs, and try to create the log file in each
      // until we succeed or run out of options
      bool success = false;
      for (vector<string>::const_iterator dir = log_dirs.begin();
           dir != log_dirs.end();
           ++dir) {
        base_filename_ = *dir + "/" + stripped_filename;
        if ( CreateLogfile(time_pid_string) ) {
          success = true;
          break;
        }
      }
      // If we never succeeded, we have to give up
      if ( success == false ) {
        perror("Could not create logging file");
        fprintf(stderr, "COULD NOT CREATE A LOGGINGFILE %s!",
                time_pid_string.c_str());
        return;
      }
    }

    // Write a header message into the log file
    ostringstream file_header_stream;
    file_header_stream.fill('0');
    file_header_stream << "Log file created at: "
                       << 1900+tm_time.tm_year << '/'
                       << setw(2) << 1+tm_time.tm_mon << '/'
                       << setw(2) << tm_time.tm_mday
                       << ' '
                       << setw(2) << tm_time.tm_hour << ':'
                       << setw(2) << tm_time.tm_min << ':'
                       << setw(2) << tm_time.tm_sec << '\n'
                       << "Running on machine: "
                       << LogDestination::hostname() << '\n'
                       << "Log line format: [IWEF]mmdd hh:mm:ss.uuuuuu "
                       << "threadid file:line] msg" << '\n';
    const string& file_header_string = file_header_stream.str();

    const int header_len = file_header_string.size();
    fwrite(file_header_string.data(), 1, header_len, file_);
    file_length_ += header_len;
    bytes_since_flush_ += header_len;
  }

  // Write to LOG file
  if ( !stop_writing ) {
    // fwrite() doesn't return an error when the disk is full, for
    // messages that are less than 4096 bytes. When the disk is full,
    // it returns the message length for messages that are less than
    // 4096 bytes. fwrite() returns 4096 for message lengths that are
    // greater than 4096, thereby indicating an error.
    errno = 0;
    fwrite(message, 1, message_len, file_);
    if ( FLAGS_stop_logging_if_full_disk &&
         errno == ENOSPC ) {  // disk full, stop writing to disk
      stop_writing = true;  // until the disk is
      return;
    } else {
      file_length_ += message_len;
      bytes_since_flush_ += message_len;
    }
  } else {
    if ( CycleClock_Now() >= next_flush_time_ )
      stop_writing = false;  // check to see if disk has free space.
    return;  // no need to flush
  }

  // See important msgs *now*.  Also, flush logs at least every 10^6 chars,
  // or every "FLAGS_logbufsecs" seconds.
  if ( force_flush ||
       (bytes_since_flush_ >= 1000000) ||
       (CycleClock_Now() >= next_flush_time_) ) {
    FlushUnlocked();
#ifdef OS_LINUX
    // Only consider files >= 3MiB
    if (FLAGS_drop_log_memory && file_length_ >= (3 << 20)) {
      // Don't evict the most recent 1-2MiB so as not to impact a tailer
      // of the log file and to avoid page rounding issue on linux < 4.7
      uint32 total_drop_length = (file_length_ & ~((1 << 20) - 1)) - (1 << 20);
      uint32 this_drop_length = total_drop_length - dropped_mem_length_;
      if (this_drop_length >= (2 << 20)) {
        // Only advise when >= 2MiB to drop
        posix_fadvise(fileno(file_), dropped_mem_length_, this_drop_length,
                      POSIX_FADV_DONTNEED);
        dropped_mem_length_ = total_drop_length;
      }
    }
#endif
  }
}

}  // namespace


// Static log data space to avoid alloc failures in a LOG(FATAL)
//
// Since multiple threads may call LOG(FATAL), and we want to preserve
// the data from the first call, we allocate two sets of space.  One
// for exclusive use by the first thread, and one for shared use by
// all other threads.
static Mutex fatal_msg_lock;
static CrashReason crash_reason;
static bool fatal_msg_exclusive = true;
static LogMessage::LogMessageData fatal_msg_data_exclusive;
static LogMessage::LogMessageData fatal_msg_data_shared;

#ifdef GLOG_THREAD_LOCAL_STORAGE
// Static thread-local log data space to use, because typically at most one
// LogMessageData object exists (in this case glog makes zero heap memory
// allocations).
static GLOG_THREAD_LOCAL_STORAGE bool thread_data_available = true;
static GLOG_THREAD_LOCAL_STORAGE char thread_msg_data[sizeof(LogMessage::LogMessageData)];
#endif // defined(GLOG_THREAD_LOCAL_STORAGE)

LogMessage::LogMessageData::LogMessageData()
  : stream_(message_text_, LogMessage::kMaxLogMessageLen, 0) {
}

LogMessage::LogMessage(const char* file, int line, LogSeverity severity,
                       int ctr, void (LogMessage::*send_method)())
    : allocated_(NULL) {
  Init(file, line, severity, send_method);
  data_->stream_.set_ctr(ctr);
}

LogMessage::LogMessage(const char* file, int line,
                       const CheckOpString& result)
    : allocated_(NULL) {
  Init(file, line, GLOG_FATAL, &LogMessage::SendToLog);
  stream() << "Check failed: " << (*result.str_) << " ";
}

LogMessage::LogMessage(const char* file, int line)
    : allocated_(NULL) {
  Init(file, line, GLOG_INFO, &LogMessage::SendToLog);
}

LogMessage::LogMessage(const char* file, int line, LogSeverity severity)
    : allocated_(NULL) {
  Init(file, line, severity, &LogMessage::SendToLog);
}

LogMessage::LogMessage(const char* file, int line, LogSeverity severity,
                       LogSink* sink, bool also_send_to_log)
    : allocated_(NULL) {
  Init(file, line, severity, also_send_to_log ? &LogMessage::SendToSinkAndLog :
                                                &LogMessage::SendToSink);
  data_->sink_ = sink;  // override Init()'s setting to NULL
}

LogMessage::LogMessage(const char* file, int line, LogSeverity severity,
                       vector<string> *outvec)
    : allocated_(NULL) {
  Init(file, line, severity, &LogMessage::SaveOrSendToLog);
  data_->outvec_ = outvec; // override Init()'s setting to NULL
}

LogMessage::LogMessage(const char* file, int line, LogSeverity severity,
                       string *message)
    : allocated_(NULL) {
  Init(file, line, severity, &LogMessage::WriteToStringAndLog);
  data_->message_ = message;  // override Init()'s setting to NULL
}

void LogMessage::Init(const char* file,
                      int line,
                      LogSeverity severity,
                      void (LogMessage::*send_method)()) {
  allocated_ = NULL;
  if (severity != GLOG_FATAL || !exit_on_dfatal) {
#ifdef GLOG_THREAD_LOCAL_STORAGE
    // No need for locking, because this is thread local.
    if (thread_data_available) {
      thread_data_available = false;
      data_ = new (&thread_msg_data) LogMessageData;
    } else {
      allocated_ = new LogMessageData();
      data_ = allocated_;
    }
#else // !defined(GLOG_THREAD_LOCAL_STORAGE)
    allocated_ = new LogMessageData();
    data_ = allocated_;
#endif // defined(GLOG_THREAD_LOCAL_STORAGE)
    data_->first_fatal_ = false;
  } else {
    MutexLock l(&fatal_msg_lock);
    if (fatal_msg_exclusive) {
      fatal_msg_exclusive = false;
      data_ = &fatal_msg_data_exclusive;
      data_->first_fatal_ = true;
    } else {
      data_ = &fatal_msg_data_shared;
      data_->first_fatal_ = false;
    }
  }

  stream().fill('0');
  data_->preserved_errno_ = errno;
  data_->severity_ = severity;
  data_->line_ = line;
  data_->send_method_ = send_method;
  data_->sink_ = NULL;
  data_->outvec_ = NULL;
  WallTime now = WallTime_Now();
  data_->timestamp_ = static_cast<time_t>(now);
  localtime_r(&data_->timestamp_, &data_->tm_time_);
  int usecs = static_cast<int>((now - data_->timestamp_) * 1000000);
  RawLog__SetLastTime(data_->tm_time_, usecs);

  data_->num_chars_to_log_ = 0;
  data_->num_chars_to_syslog_ = 0;
  data_->basename_ = const_basename(file);
  data_->fullname_ = file;
  data_->has_been_flushed_ = false;

  // If specified, prepend a prefix to each line.  For example:
  //    I1018 160715 f5d4fbb0 logging.cc:1153]
  //    (log level, GMT month, date, time, thread_id, file basename, line)
  // We exclude the thread_id for the default thread.
  if (FLAGS_log_prefix && (line != kNoLogPrefix)) {
    stream() << LogSeverityNames[severity][0]
             << setw(2) << 1+data_->tm_time_.tm_mon
             << setw(2) << data_->tm_time_.tm_mday
             << ' '
             << setw(2) << data_->tm_time_.tm_hour  << ':'
             << setw(2) << data_->tm_time_.tm_min   << ':'
             << setw(2) << data_->tm_time_.tm_sec   << "."
             << setw(6) << usecs
             << ' '
             << setfill(' ') << setw(5)
             << static_cast<unsigned int>(GetTID()) << setfill('0')
             << ' '
             << data_->basename_ << ':' << data_->line_ << "] ";
  }
  data_->num_prefix_chars_ = data_->stream_.pcount();

  if (!FLAGS_log_backtrace_at.empty()) {
    char fileline[128];
    snprintf(fileline, sizeof(fileline), "%s:%d", data_->basename_, line);
#ifdef HAVE_STACKTRACE
    if (!strcmp(FLAGS_log_backtrace_at.c_str(), fileline)) {
      string stacktrace;
      DumpStackTraceToString(&stacktrace);
      stream() << " (stacktrace:\n" << stacktrace << ") ";
    }
#endif
  }
}

LogMessage::~LogMessage() {
  Flush();
#ifdef GLOG_THREAD_LOCAL_STORAGE
  if (data_ == static_cast<void*>(thread_msg_data)) {
    data_->~LogMessageData();
    thread_data_available = true;
  }
  else {
    delete allocated_;
  }
#else // !defined(GLOG_THREAD_LOCAL_STORAGE)
  delete allocated_;
#endif // defined(GLOG_THREAD_LOCAL_STORAGE)
}

int LogMessage::preserved_errno() const {
  return data_->preserved_errno_;
}

ostream& LogMessage::stream() {
  return data_->stream_;
}

// Flush buffered message, called by the destructor, or any other function
// that needs to synchronize the log.
void LogMessage::Flush() {
  if (data_->has_been_flushed_ || data_->severity_ < FLAGS_minloglevel)
    return;

  data_->num_chars_to_log_ = data_->stream_.pcount();
  data_->num_chars_to_syslog_ =
    data_->num_chars_to_log_ - data_->num_prefix_chars_;

  // Do we need to add a \n to the end of this message?
  bool append_newline =
      (data_->message_text_[data_->num_chars_to_log_-1] != '\n');
  char original_final_char = '\0';

  // If we do need to add a \n, we'll do it by violating the memory of the
  // ostrstream buffer.  This is quick, and we'll make sure to undo our
  // modification before anything else is done with the ostrstream.  It
  // would be preferable not to do things this way, but it seems to be
  // the best way to deal with this.
  if (append_newline) {
    original_final_char = data_->message_text_[data_->num_chars_to_log_];
    data_->message_text_[data_->num_chars_to_log_++] = '\n';
  }

  // Prevent any subtle race conditions by wrapping a mutex lock around
  // the actual logging action per se.
  {
    MutexLock l(&log_mutex);
    (this->*(data_->send_method_))();
    ++num_messages_[static_cast<int>(data_->severity_)];
  }
  LogDestination::WaitForSinks(data_);

  if (append_newline) {
    // Fix the ostrstream back how it was before we screwed with it.
    // It's 99.44% certain that we don't need to worry about doing this.
    data_->message_text_[data_->num_chars_to_log_-1] = original_final_char;
  }

  // If errno was already set before we enter the logging call, we'll
  // set it back to that value when we return from the logging call.
  // It happens often that we log an error message after a syscall
  // failure, which can potentially set the errno to some other
  // values.  We would like to preserve the original errno.
  if (data_->preserved_errno_ != 0) {
    errno = data_->preserved_errno_;
  }

  // Note that this message is now safely logged.  If we're asked to flush
  // again, as a result of destruction, say, we'll do nothing on future calls.
  data_->has_been_flushed_ = true;
}

// Copy of first FATAL log message so that we can print it out again
// after all the stack traces.  To preserve legacy behavior, we don't
// use fatal_msg_data_exclusive.
static time_t fatal_time;
static char fatal_message[256];

void ReprintFatalMessage() {
  if (fatal_message[0]) {
    const int n = strlen(fatal_message);
    if (!FLAGS_logtostderr) {
      // Also write to stderr (don't color to avoid terminal checks)
      WriteToStderr(fatal_message, n);
    }
    LogDestination::LogToAllLogfiles(GLOG_ERROR, fatal_time, fatal_message, n);
  }
}

// L >= log_mutex (callers must hold the log_mutex).
void LogMessage::SendToLog() EXCLUSIVE_LOCKS_REQUIRED(log_mutex) {
  static bool already_warned_before_initgoogle = false;

  log_mutex.AssertHeld();

  RAW_DCHECK(data_->num_chars_to_log_ > 0 &&
             data_->message_text_[data_->num_chars_to_log_-1] == '\n', "");

  // Messages of a given severity get logged to lower severity logs, too

  if (!already_warned_before_initgoogle && !IsGoogleLoggingInitialized()) {
    const char w[] = "WARNING: Logging before InitGoogleLogging() is "
                     "written to STDERR\n";
    WriteToStderr(w, strlen(w));
    already_warned_before_initgoogle = true;
  }

  // global flag: never log to file if set.  Also -- don't log to a
  // file if we haven't parsed the command line flags to get the
  // program name.
  if (FLAGS_logtostderr || !IsGoogleLoggingInitialized()) {
    ColoredWriteToStderr(data_->severity_,
                         data_->message_text_, data_->num_chars_to_log_);

    // this could be protected by a flag if necessary.
    LogDestination::LogToSinks(data_->severity_,
                               data_->fullname_, data_->basename_,
                               data_->line_, &data_->tm_time_,
                               data_->message_text_ + data_->num_prefix_chars_,
                               (data_->num_chars_to_log_ -
                                data_->num_prefix_chars_ - 1));
  } else {

    // log this message to all log files of severity <= severity_
    LogDestination::LogToAllLogfiles(data_->severity_, data_->timestamp_,
                                     data_->message_text_,
                                     data_->num_chars_to_log_);

    LogDestination::MaybeLogToStderr(data_->severity_, data_->message_text_,
                                     data_->num_chars_to_log_);
    LogDestination::MaybeLogToEmail(data_->severity_, data_->message_text_,
                                    data_->num_chars_to_log_);
    LogDestination::LogToSinks(data_->severity_,
                               data_->fullname_, data_->basename_,
                               data_->line_, &data_->tm_time_,
                               data_->message_text_ + data_->num_prefix_chars_,
                               (data_->num_chars_to_log_
                                - data_->num_prefix_chars_ - 1));
    // NOTE: -1 removes trailing \n
  }

  // If we log a FATAL message, flush all the log destinations, then toss
  // a signal for others to catch. We leave the logs in a state that
  // someone else can use them (as long as they flush afterwards)
  if (data_->severity_ == GLOG_FATAL && exit_on_dfatal) {
    if (data_->first_fatal_) {
      // Store crash information so that it is accessible from within signal
      // handlers that may be invoked later.
      RecordCrashReason(&crash_reason);
      SetCrashReason(&crash_reason);

      // Store shortened fatal message for other logs and GWQ status
      const int copy = min<int>(data_->num_chars_to_log_,
                                sizeof(fatal_message)-1);
      memcpy(fatal_message, data_->message_text_, copy);
      fatal_message[copy] = '\0';
      fatal_time = data_->timestamp_;
    }

    if (!FLAGS_logtostderr) {
      for (int i = 0; i < NUM_SEVERITIES; ++i) {
        if ( LogDestination::log_destinations_[i] )
          LogDestination::log_destinations_[i]->logger_->Write(true, 0, "", 0);
      }
    }

    // release the lock that our caller (directly or indirectly)
    // LogMessage::~LogMessage() grabbed so that signal handlers
    // can use the logging facility. Alternately, we could add
    // an entire unsafe logging interface to bypass locking
    // for signal handlers but this seems simpler.
    log_mutex.Unlock();
    LogDestination::WaitForSinks(data_);

    const char* message = "*** Check failure stack trace: ***\n";
    if (write(STDERR_FILENO, message, strlen(message)) < 0) {
      // Ignore errors.
    }
    Fail();
  }
}

void LogMessage::RecordCrashReason(
    glog_internal_namespace_::CrashReason* reason) {
  reason->filename = fatal_msg_data_exclusive.fullname_;
  reason->line_number = fatal_msg_data_exclusive.line_;
  reason->message = fatal_msg_data_exclusive.message_text_ +
                    fatal_msg_data_exclusive.num_prefix_chars_;
#ifdef HAVE_STACKTRACE
  // Retrieve the stack trace, omitting the logging frames that got us here.
  reason->depth = GetStackTrace(reason->stack, ARRAYSIZE(reason->stack), 4);
#else
  reason->depth = 0;
#endif
}

#ifdef HAVE___ATTRIBUTE__
# define ATTRIBUTE_NORETURN __attribute__((noreturn))
#else
# define ATTRIBUTE_NORETURN
#endif

#if defined(OS_WINDOWS)
__declspec(noreturn)
#endif
static void logging_fail() ATTRIBUTE_NORETURN;

static void logging_fail() {
  abort();
}

typedef void (*logging_fail_func_t)() ATTRIBUTE_NORETURN;

GOOGLE_GLOG_DLL_DECL
logging_fail_func_t g_logging_fail_func = &logging_fail;

void InstallFailureFunction(void (*fail_func)()) {
  g_logging_fail_func = (logging_fail_func_t)fail_func;
}

void LogMessage::Fail() {
  g_logging_fail_func();
}

// L >= log_mutex (callers must hold the log_mutex).
void LogMessage::SendToSink() EXCLUSIVE_LOCKS_REQUIRED(log_mutex) {
  if (data_->sink_ != NULL) {
    RAW_DCHECK(data_->num_chars_to_log_ > 0 &&
               data_->message_text_[data_->num_chars_to_log_-1] == '\n', "");
    data_->sink_->send(data_->severity_, data_->fullname_, data_->basename_,
                       data_->line_, &data_->tm_time_,
                       data_->message_text_ + data_->num_prefix_chars_,
                       (data_->num_chars_to_log_ -
                        data_->num_prefix_chars_ - 1));
  }
}

// L >= log_mutex (callers must hold the log_mutex).
void LogMessage::SendToSinkAndLog() EXCLUSIVE_LOCKS_REQUIRED(log_mutex) {
  SendToSink();
  SendToLog();
}

// L >= log_mutex (callers must hold the log_mutex).
void LogMessage::SaveOrSendToLog() EXCLUSIVE_LOCKS_REQUIRED(log_mutex) {
  if (data_->outvec_ != NULL) {
    RAW_DCHECK(data_->num_chars_to_log_ > 0 &&
               data_->message_text_[data_->num_chars_to_log_-1] == '\n', "");
    // Omit prefix of message and trailing newline when recording in outvec_.
    const char *start = data_->message_text_ + data_->num_prefix_chars_;
    int len = data_->num_chars_to_log_ - data_->num_prefix_chars_ - 1;
    data_->outvec_->push_back(string(start, len));
  } else {
    SendToLog();
  }
}

void LogMessage::WriteToStringAndLog() EXCLUSIVE_LOCKS_REQUIRED(log_mutex) {
  if (data_->message_ != NULL) {
    RAW_DCHECK(data_->num_chars_to_log_ > 0 &&
               data_->message_text_[data_->num_chars_to_log_-1] == '\n', "");
    // Omit prefix of message and trailing newline when writing to message_.
    const char *start = data_->message_text_ + data_->num_prefix_chars_;
    int len = data_->num_chars_to_log_ - data_->num_prefix_chars_ - 1;
    data_->message_->assign(start, len);
  }
  SendToLog();
}

// L >= log_mutex (callers must hold the log_mutex).
void LogMessage::SendToSyslogAndLog() {
#ifdef HAVE_SYSLOG_H
  // Before any calls to syslog(), make a single call to openlog()
  static bool openlog_already_called = false;
  if (!openlog_already_called) {
    openlog(glog_internal_namespace_::ProgramInvocationShortName(),
            LOG_CONS | LOG_NDELAY | LOG_PID,
            LOG_USER);
    openlog_already_called = true;
  }

  // This array maps Google severity levels to syslog levels
  const int SEVERITY_TO_LEVEL[] = { LOG_INFO, LOG_WARNING, LOG_ERR, LOG_EMERG };
  syslog(LOG_USER | SEVERITY_TO_LEVEL[static_cast<int>(data_->severity_)], "%.*s",
         int(data_->num_chars_to_syslog_),
         data_->message_text_ + data_->num_prefix_chars_);
  SendToLog();
#else
  LOG(ERROR) << "No syslog support: message=" << data_->message_text_;
#endif
}

base::Logger* base::GetLogger(LogSeverity severity) {
  MutexLock l(&log_mutex);
  return LogDestination::log_destination(severity)->logger_;
}

void base::SetLogger(LogSeverity severity, base::Logger* logger) {
  MutexLock l(&log_mutex);
  LogDestination::log_destination(severity)->logger_ = logger;
}

// L < log_mutex.  Acquires and releases mutex_.
int64 LogMessage::num_messages(int severity) {
  MutexLock l(&log_mutex);
  return num_messages_[severity];
}

// Output the COUNTER value. This is only valid if ostream is a
// LogStream.
ostream& operator<<(ostream &os, const PRIVATE_Counter&) {
#ifdef DISABLE_RTTI
  LogMessage::LogStream *log = static_cast<LogMessage::LogStream*>(&os);
#else
  LogMessage::LogStream *log = dynamic_cast<LogMessage::LogStream*>(&os);
#endif
  CHECK(log && log == log->self())
      << "You must not use COUNTER with non-glog ostream";
  os << log->ctr();
  return os;
}

ErrnoLogMessage::ErrnoLogMessage(const char* file, int line,
                                 LogSeverity severity, int ctr,
                                 void (LogMessage::*send_method)())
    : LogMessage(file, line, severity, ctr, send_method) {
}

string StrError(int err);

ErrnoLogMessage::~ErrnoLogMessage() {
  // Don't access errno directly because it may have been altered
  // while streaming the message.
  stream() << ": " << StrError(preserved_errno()) << " ["
           << preserved_errno() << "]";
}

void FlushLogFiles(LogSeverity min_severity) {
  LogDestination::FlushLogFiles(min_severity);
}

void FlushLogFilesUnsafe(LogSeverity min_severity) {
  LogDestination::FlushLogFilesUnsafe(min_severity);
}

void SetLogDestination(LogSeverity severity, const char* base_filename) {
  LogDestination::SetLogDestination(severity, base_filename);
}

void SetLogSymlink(LogSeverity severity, const char* symlink_basename) {
  LogDestination::SetLogSymlink(severity, symlink_basename);
}

LogSink::~LogSink() {
}

void LogSink::WaitTillSent() {
  // noop default
}

string LogSink::ToString(LogSeverity severity, const char* file, int line,
                         const struct ::tm* tm_time,
                         const char* message, size_t message_len) {
  ostringstream stream(string(message, message_len));
  stream.fill('0');

  // FIXME(jrvb): Updating this to use the correct value for usecs
  // requires changing the signature for both this method and
  // LogSink::send().  This change needs to be done in a separate CL
  // so subclasses of LogSink can be updated at the same time.
  int usecs = 0;

  stream << LogSeverityNames[severity][0]
         << setw(2) << 1+tm_time->tm_mon
         << setw(2) << tm_time->tm_mday
         << ' '
         << setw(2) << tm_time->tm_hour << ':'
         << setw(2) << tm_time->tm_min << ':'
         << setw(2) << tm_time->tm_sec << '.'
         << setw(6) << usecs
         << ' '
         << setfill(' ') << setw(5) << GetTID() << setfill('0')
         << ' '
         << file << ':' << line << "] ";

  stream << string(message, message_len);
  return stream.str();
}

void AddLogSink(LogSink *destination) {
  LogDestination::AddLogSink(destination);
}

void RemoveLogSink(LogSink *destination) {
  LogDestination::RemoveLogSink(destination);
}

void SetLogFilenameExtension(const char* ext) {
  LogDestination::SetLogFilenameExtension(ext);
}

void SetStderrLogging(LogSeverity min_severity) {
  LogDestination::SetStderrLogging(min_severity);
}

void SetEmailLogging(LogSeverity min_severity, const char* addresses) {
  LogDestination::SetEmailLogging(min_severity, addresses);
}

void LogToStderr() {
  LogDestination::LogToStderr();
}

namespace base {
namespace internal {

bool GetExitOnDFatal() {
  MutexLock l(&log_mutex);
  return exit_on_dfatal;
}

// Determines whether we exit the program for a LOG(DFATAL) message in
// debug mode.  It does this by skipping the call to Fail/FailQuietly.
// This is intended for testing only.
//
// This can have some effects on LOG(FATAL) as well.  Failure messages
// are always allocated (rather than sharing a buffer), the crash
// reason is not recorded, the "gwq" status message is not updated,
// and the stack trace is not recorded.  The LOG(FATAL) *will* still
// exit the program.  Since this function is used only in testing,
// these differences are acceptable.
void SetExitOnDFatal(bool value) {
  MutexLock l(&log_mutex);
  exit_on_dfatal = value;
}

}  // namespace internal
}  // namespace base

// Shell-escaping as we need to shell out ot /bin/mail.
static const char kDontNeedShellEscapeChars[] =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyz"
            "0123456789+-_.=/:,@";

static string ShellEscape(const string& src) {
  string result;
  if (!src.empty() &&  // empty string needs quotes
      src.find_first_not_of(kDontNeedShellEscapeChars) == string::npos) {
    // only contains chars that don't need quotes; it's fine
    result.assign(src);
  } else if (src.find_first_of('\'') == string::npos) {
    // no single quotes; just wrap it in single quotes
    result.assign("'");
    result.append(src);
    result.append("'");
  } else {
    // needs double quote escaping
    result.assign("\"");
    for (size_t i = 0; i < src.size(); ++i) {
      switch (src[i]) {
        case '\\':
        case '$':
        case '"':
        case '`':
          result.append("\\");
      }
      result.append(src, i, 1);
    }
    result.append("\"");
  }
  return result;
}


// use_logging controls whether the logging functions LOG/VLOG are used
// to log errors.  It should be set to false when the caller holds the
// log_mutex.
static bool SendEmailInternal(const char*dest, const char *subject,
                              const char*body, bool use_logging) {
  if (dest && *dest) {
    if ( use_logging ) {
      VLOG(1) << "Trying to send TITLE:" << subject
              << " BODY:" << body << " to " << dest;
    } else {
      fprintf(stderr, "Trying to send TITLE: %s BODY: %s to %s\n",
              subject, body, dest);
    }

    string cmd =
        FLAGS_logmailer + " -s" +
        ShellEscape(subject) + " " + ShellEscape(dest);
    VLOG(4) << "Mailing command: " << cmd;

    FILE* pipe = popen(cmd.c_str(), "w");
    if (pipe != NULL) {
      // Add the body if we have one
      if (body)
        fwrite(body, sizeof(char), strlen(body), pipe);
      bool ok = pclose(pipe) != -1;
      if ( !ok ) {
        if ( use_logging ) {
          LOG(ERROR) << "Problems sending mail to " << dest << ": "
                     << StrError(errno);
        } else {
          fprintf(stderr, "Problems sending mail to %s: %s\n",
                  dest, StrError(errno).c_str());
        }
      }
      return ok;
    } else {
      if ( use_logging ) {
        LOG(ERROR) << "Unable to send mail to " << dest;
      } else {
        fprintf(stderr, "Unable to send mail to %s\n", dest);
      }
    }
  }
  return false;
}

bool SendEmail(const char*dest, const char *subject, const char*body){
  return SendEmailInternal(dest, subject, body, true);
}

static void GetTempDirectories(vector<string>* list) {
  list->clear();
#ifdef OS_WINDOWS
  // On windows we'll try to find a directory in this order:
  //   C:/Documents & Settings/whomever/TEMP (or whatever GetTempPath() is)
  //   C:/TMP/
  //   C:/TEMP/
  //   C:/WINDOWS/ or C:/WINNT/
  //   .
  char tmp[MAX_PATH];
  if (GetTempPathA(MAX_PATH, tmp))
    list->push_back(tmp);
  list->push_back("C:\\tmp\\");
  list->push_back("C:\\temp\\");
#else
  // Directories, in order of preference. If we find a dir that
  // exists, we stop adding other less-preferred dirs
  const char * candidates[] = {
    // Non-null only during unittest/regtest
    getenv("TEST_TMPDIR"),

    // Explicitly-supplied temp dirs
    getenv("TMPDIR"), getenv("TMP"),

    // If all else fails
    "/tmp",
  };

  for (size_t i = 0; i < ARRAYSIZE(candidates); i++) {
    const char *d = candidates[i];
    if (!d) continue;  // Empty env var

    // Make sure we don't surprise anyone who's expecting a '/'
    string dstr = d;
    if (dstr[dstr.size() - 1] != '/') {
      dstr += "/";
    }
    list->push_back(dstr);

    struct stat statbuf;
    if (!stat(d, &statbuf) && S_ISDIR(statbuf.st_mode)) {
      // We found a dir that exists - we're done.
      return;
    }
  }

#endif
}

static vector<string>* logging_directories_list;

const vector<string>& GetLoggingDirectories() {
  // Not strictly thread-safe but we're called early in InitGoogle().
  if (logging_directories_list == NULL) {
    logging_directories_list = new vector<string>;

    if ( !FLAGS_log_dir.empty() ) {
      // A dir was specified, we should use it
      logging_directories_list->push_back(FLAGS_log_dir.c_str());
    } else {
      GetTempDirectories(logging_directories_list);
#ifdef OS_WINDOWS
      char tmp[MAX_PATH];
      if (GetWindowsDirectoryA(tmp, MAX_PATH))
        logging_directories_list->push_back(tmp);
      logging_directories_list->push_back(".\\");
#else
      logging_directories_list->push_back("./");
#endif
    }
  }
  return *logging_directories_list;
}

void TestOnly_ClearLoggingDirectoriesList() {
  fprintf(stderr, "TestOnly_ClearLoggingDirectoriesList should only be "
          "called from test code.\n");
  delete logging_directories_list;
  logging_directories_list = NULL;
}

void GetExistingTempDirectories(vector<string>* list) {
  GetTempDirectories(list);
  vector<string>::iterator i_dir = list->begin();
  while( i_dir != list->end() ) {
    // zero arg to access means test for existence; no constant
    // defined on windows
    if ( access(i_dir->c_str(), 0) ) {
      i_dir = list->erase(i_dir);
    } else {
      ++i_dir;
    }
  }
}

void TruncateLogFile(const char *path, int64 limit, int64 keep) {
#ifdef HAVE_UNISTD_H
  struct stat statbuf;
  const int kCopyBlockSize = 8 << 10;
  char copybuf[kCopyBlockSize];
  int64 read_offset, write_offset;
  // Don't follow symlinks unless they're our own fd symlinks in /proc
  int flags = O_RDWR;
  // TODO(hamaji): Support other environments.
#ifdef OS_LINUX
  const char *procfd_prefix = "/proc/self/fd/";
  if (strncmp(procfd_prefix, path, strlen(procfd_prefix))) flags |= O_NOFOLLOW;
#endif

  int fd = open(path, flags);
  if (fd == -1) {
    if (errno == EFBIG) {
      // The log file in question has got too big for us to open. The
      // real fix for this would be to compile logging.cc (or probably
      // all of base/...) with -D_FILE_OFFSET_BITS=64 but that's
      // rather scary.
      // Instead just truncate the file to something we can manage
      if (truncate(path, 0) == -1) {
        PLOG(ERROR) << "Unable to truncate " << path;
      } else {
        LOG(ERROR) << "Truncated " << path << " due to EFBIG error";
      }
    } else {
      PLOG(ERROR) << "Unable to open " << path;
    }
    return;
  }

  if (fstat(fd, &statbuf) == -1) {
    PLOG(ERROR) << "Unable to fstat()";
    goto out_close_fd;
  }

  // See if the path refers to a regular file bigger than the
  // specified limit
  if (!S_ISREG(statbuf.st_mode)) goto out_close_fd;
  if (statbuf.st_size <= limit)  goto out_close_fd;
  if (statbuf.st_size <= keep) goto out_close_fd;

  // This log file is too large - we need to truncate it
  LOG(INFO) << "Truncating " << path << " to " << keep << " bytes";

  // Copy the last "keep" bytes of the file to the beginning of the file
  read_offset = statbuf.st_size - keep;
  write_offset = 0;
  int bytesin, bytesout;
  while ((bytesin = pread(fd, copybuf, sizeof(copybuf), read_offset)) > 0) {
    bytesout = pwrite(fd, copybuf, bytesin, write_offset);
    if (bytesout == -1) {
      PLOG(ERROR) << "Unable to write to " << path;
      break;
    } else if (bytesout != bytesin) {
      LOG(ERROR) << "Expected to write " << bytesin << ", wrote " << bytesout;
    }
    read_offset += bytesin;
    write_offset += bytesout;
  }
  if (bytesin == -1) PLOG(ERROR) << "Unable to read from " << path;

  // Truncate the remainder of the file. If someone else writes to the
  // end of the file after our last read() above, we lose their latest
  // data. Too bad ...
  if (ftruncate(fd, write_offset) == -1) {
    PLOG(ERROR) << "Unable to truncate " << path;
  }

 out_close_fd:
  close(fd);
#else
  LOG(ERROR) << "No log truncation support.";
#endif
}

void TruncateStdoutStderr() {
#ifdef HAVE_UNISTD_H
  int64 limit = MaxLogSize() << 20;
  int64 keep = 1 << 20;
  TruncateLogFile("/proc/self/fd/1", limit, keep);
  TruncateLogFile("/proc/self/fd/2", limit, keep);
#else
  LOG(ERROR) << "No log truncation support.";
#endif
}


// Helper functions for string comparisons.
#define DEFINE_CHECK_STROP_IMPL(name, func, expected)                   \
  string* Check##func##expected##Impl(const char* s1, const char* s2,   \
                                      const char* names) {              \
    bool equal = s1 == s2 || (s1 && s2 && !func(s1, s2));               \
    if (equal == expected) return NULL;                                 \
    else {                                                              \
      ostringstream ss;                                                 \
      if (!s1) s1 = "";                                                 \
      if (!s2) s2 = "";                                                 \
      ss << #name " failed: " << names << " (" << s1 << " vs. " << s2 << ")"; \
      return new string(ss.str());                                      \
    }                                                                   \
  }
DEFINE_CHECK_STROP_IMPL(CHECK_STREQ, strcmp, true)
DEFINE_CHECK_STROP_IMPL(CHECK_STRNE, strcmp, false)
DEFINE_CHECK_STROP_IMPL(CHECK_STRCASEEQ, strcasecmp, true)
DEFINE_CHECK_STROP_IMPL(CHECK_STRCASENE, strcasecmp, false)
#undef DEFINE_CHECK_STROP_IMPL

int posix_strerror_r(int err, char *buf, size_t len) {
  // Sanity check input parameters
  if (buf == NULL || len <= 0) {
    errno = EINVAL;
    return -1;
  }

  // Reset buf and errno, and try calling whatever version of strerror_r()
  // is implemented by glibc
  buf[0] = '\000';
  int old_errno = errno;
  errno = 0;
  char *rc = reinterpret_cast<char *>(strerror_r(err, buf, len));

  // Both versions set errno on failure
  if (errno) {
    // Should already be there, but better safe than sorry
    buf[0]     = '\000';
    return -1;
  }
  errno = old_errno;

  // POSIX is vague about whether the string will be terminated, although
  // is indirectly implies that typically ERANGE will be returned, instead
  // of truncating the string. This is different from the GNU implementation.
  // We play it safe by always terminating the string explicitly.
  buf[len-1] = '\000';

  // If the function succeeded, we can use its exit code to determine the
  // semantics implemented by glibc
  if (!rc) {
    return 0;
  } else {
    // GNU semantics detected
    if (rc == buf) {
      return 0;
    } else {
      buf[0] = '\000';
#if defined(OS_MACOSX) || defined(OS_FREEBSD) || defined(OS_OPENBSD)
      if (reinterpret_cast<intptr_t>(rc) < sys_nerr) {
        // This means an error on MacOSX or FreeBSD.
        return -1;
      }
#endif
      strncat(buf, rc, len-1);
      return 0;
    }
  }
}

string StrError(int err) {
  char buf[100];
  int rc = posix_strerror_r(err, buf, sizeof(buf));
  if ((rc < 0) || (buf[0] == '\000')) {
    snprintf(buf, sizeof(buf), "Error number %d", err);
  }
  return buf;
}

LogMessageFatal::LogMessageFatal(const char* file, int line) :
    LogMessage(file, line, GLOG_FATAL) {}

LogMessageFatal::LogMessageFatal(const char* file, int line,
                                 const CheckOpString& result) :
    LogMessage(file, line, result) {}

LogMessageFatal::~LogMessageFatal() {
    Flush();
    LogMessage::Fail();
}

namespace base {

CheckOpMessageBuilder::CheckOpMessageBuilder(const char *exprtext)
    : stream_(new ostringstream) {
  *stream_ << exprtext << " (";
}

CheckOpMessageBuilder::~CheckOpMessageBuilder() {
  delete stream_;
}

ostream* CheckOpMessageBuilder::ForVar2() {
  *stream_ << " vs. ";
  return stream_;
}

string* CheckOpMessageBuilder::NewString() {
  *stream_ << ")";
  return new string(stream_->str());
}

}  // namespace base

template <>
void MakeCheckOpValueString(std::ostream* os, const char& v) {
  if (v >= 32 && v <= 126) {
    (*os) << "'" << v << "'";
  } else {
    (*os) << "char value " << (short)v;
  }
}

template <>
void MakeCheckOpValueString(std::ostream* os, const signed char& v) {
  if (v >= 32 && v <= 126) {
    (*os) << "'" << v << "'";
  } else {
    (*os) << "signed char value " << (short)v;
  }
}

template <>
void MakeCheckOpValueString(std::ostream* os, const unsigned char& v) {
  if (v >= 32 && v <= 126) {
    (*os) << "'" << v << "'";
  } else {
    (*os) << "unsigned char value " << (unsigned short)v;
  }
}

void InitGoogleLogging(const char* argv0) {
  glog_internal_namespace_::InitGoogleLoggingUtilities(argv0);
}

void ShutdownGoogleLogging() {
  glog_internal_namespace_::ShutdownGoogleLoggingUtilities();
  LogDestination::DeleteLogDestinations();
  delete logging_directories_list;
  logging_directories_list = NULL;
}

_END_GOOGLE_NAMESPACE_
