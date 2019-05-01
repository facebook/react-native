# The Folly Logging Library

`folly::logging` is a logging library for C++.

It allows configurable logging of text-based messages, and pays special
attention to supporting debug logging.

It has two primary goals:

1. Very cheap debug log statements
2. Configurable, hierarchical log categories

Together these two features make it possible to leave lots of debug log
statements present in production code with little overhead, and to then easily
turn on debug messages for specific parts of the code base at runtime when
troubleshooting.

# Usage

The [Usage](Usage.md) document provides a overview of how to use the logging
library.  The [Log Categories](LogCategories.md) document describes the basic
behavior of log categories.

# Features

## Very cheap debug log statements

Folly logging statements normally boil down to a single conditional `if` check
when the log message is disabled.  The arguments to be logged are evaluated
lazily, and are never evaluated if the log message is disabled.

This makes it possible to leave debug log statements present even in fairly hot
code paths with minimal performance impact.

## Hierarchical log categories

Folly logging uses a hierarchical log category model, similar to the one
popularized by [Apache Log4j](https://logging.apache.org/log4j/)

See the [Log Categories](LogCategories.md) document for a more complete
description of how log categories work.

This model makes it easy to control the logging levels for specific portions of
the code.  Specific category settings can be changed to enable log messages in
specific files or specific sections of the code, and settings on higher level
categories can be adjusted to easily enable or disable log messages for larger
sections of the code.

This also makes it easy for teams to run their programs with elevated log
levels for code they maintain, while turning down potentially noisy messages
from libraries they depend on.

## Automatically chosen log category names

Picking good log category names and consistently using them throughout the code
base can sometimes be a challenge with log4j-style logging libraries.  Folly
logging provides an `XLOG()` macro that automatically picks a log category name
based on the current filename, eliminating the need for programmers to worry
about log category names in most cases.

The `XLOG()` macro chooses a log category name based on the source file path,
with directory separators replaced by `.`.  This allows log categories to
re-use the directory hierarchy decisions that have already been made.

## Asynchronous I/O

Folly logging provide log handlers that perform I/O asynchronously in a
separate thread, to avoid slowing down your main program threads if log
messages are being generated faster than they can be written to the output file
or stream.  These asynchronous log writers will drop messages rather than
slowing down your main processing threads if log messages are being generated
faster than they can be consumed.

Performing I/O directly in the thread that generated the log message can often
be problematic, particularly if an unexpected event or configuration change
suddenly makes your code log more messages than normal.

This behavior is easily configurable, so that you can choose the best trade-off
for your program (possibly dropping some messages vs possibly blocking threads
on logging I/O). When using asynchronous logging, you also have the option to
specify levels above which you would like to enable synchronous logging.
This can help ensure that all logs of a certain level or above are persisted
before a potential crash while ensuring that all logs below that level remain
non-blocking.

## Support for folly::format()

The `XLOGF()` and `FB_LOGF()` macros format their arguments using
`folly::format()`.  This allows log statements to use the powerful Python-like
format syntax supported by
[`folly::format()`](https://github.com/facebook/folly/blob/master/folly/docs/Format.md)

Additionally he `XLOG()` and `FB_LOG()` macros concatenate any log arguments
using `folly::to<string>()`, and also accept arguments via iostream-style `<<`
syntax.

## Safe handling of unprintable characters

The folly logging framework automatically escapes unprintable characters in log
messages by default.  This helps avoid security vulnerabilities such as
[CVE-2013-1862](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-1862)
and
[CVE-2009-4496](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2009-4496).
