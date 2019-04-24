# Comparing `folly::logging` to other log libraries

This document attempts to briefly describe the differences between the folly
logging library and other C++ logging libraries.  This is not necessarily
comprehensive, and may become out of date as libraries change.

## [Google Logging (glog)](https://github.com/google/glog)

The folly logging library is similar to glog in many ways.

Like folly logging, glog also provides very cheap debug log messages with its
`VLOG` macro.  (However, the glog `LOG` macro is not lazy, and always evaluates
its arguments, even if the log message is disabled.)

The primary difference between folly logging and glog is that folly offers more
flexibility in turning debug messages on or off.  The `VLOG()` macros can be
enabled or disabled on per-file basis through a `--vmodule` command line flag
on non-Windows platforms.  This flag does support regular expressions to match
groups of files, but the expression only applies to the last component of the
file name.  This makes it more difficult to control logging for specific
libraries and subcomponents of a project.

Other advantages of folly logging over glog:

* Logging I/O can be performed in a separate thread.  glog performs all logging
  I/O in the thread that generated the log message.  This can block processing
  while waiting for logging I/O to complete.
* Unprintable characters in multi-line log messages are escaped by default.
  This helps avoid problematic or dangerous terminal escape sequences from
  appearing in log messages.
* Better support for multi-line log messages.  Folly logging adds a log message
  header after each internal new line in log messages.
* Full functionality on Windows.  The `VLOG()` macro from `glog` has somewhat
  diminished functionality on Windows, since it cannot be controlled on a
  per-module basis.

Advantages of glog over folly logging:

* Smaller generated code size.  Due to automatically picking a log category
  name, folly logging's `XLOG()` macros currently result in slightly larger
  generated code compared to `VLOG()`.

## Log4j Clones

There are a number of Log4j-like libraries for C++ (log4cxx, log4cpp,
log4cplus).

Conceptually folly logging behaves similarly to most of these libraries.  Much
of folly logging's hierarchical log category behavior was modeled after log4j
functionality, like these libraries.

The main difference between folly logging and most of these libraries is
low overhead for disabled log messages.  The folly logging code ensures that
disabled log messages boil down to a single conditional level check.  Most of
the other C++ log4j clones always evaluate log message arguments, and some also
perform more complex hierarchical log level checks at log time.
