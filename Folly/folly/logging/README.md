Overview
--------

This is a flexible logging library for C++, targeted primarily at debug logging
support.  It supports hierarchical log categories to easily control debug log
levels.  It also aims to have minimal performance overhead for disabled log
statements, making it possible to keep debug log statements throughout the code
base, even in performance critical sections.  This allows debug log messages to
be easily turned on for particular areas of the code at runtime when necessary
to help debug an issue, without having to worry about the overhead of log
messages during normal use.

Log Categories
--------------

## Log Category Names

All log messages get logged to a particular log category.  Log category names
are hierarchical, separated by periods.  For instance, `folly.io` and
`folly.futures` are both sub-categories of `folly`.  `folly.io.async` is a
sub-category of `folly.io`.  The root category's name is the empty string.

## Log Level Checks

When a message is logged to a given category, an admittance check is performed
to see if the log message should be enabled.  The admittance check compares the
log level of the message against the effective level of that category.

By default the effective level of a category is the minimum of its level and
the level set for any of its parent categories.  This means that when you
increase the log verbosity for a particular category you automatically turn up
the verbosity for the entire tree of children categories underneath it.

For example, setting the log level for the `folly` category to `WARN` means
that log messages to any sub-category under `folly` will be admitted if they
have a level of `WARN` or higher.  If the level for `folly.io` is `DEBUG`, then
messages to all categories under `folly.io` will admit `DEBUG` and higher
messages, while the rest of the categories `folly` under folly would admit
`WARN` and higher messages.

However, you can also configure specific log categories to turn off inheritance
of their parent log levels.  This allows you to increase the log verbosity for
a large category tree, but still use a lower verbosity for specific
sub-categories.  For example, if the `folly` category's level is set to
`DEBUG`, but you disable level inheritance for `folly.futures`, the
`folly.futures` level will not use it's parent's `DEBUG` log level, and will
only consider the level set locally on this category.

Once a log message is admitted, it is processed by the `LogCategory` where it
was logged, as well as by all parent log categories, up to the root.

## Log Handlers

`LogHandler` objects can be attached to a log category.  When a log message is
received at a given log category it will be given to all `LogHandler` objects
attached to that category.

`LogHandler` objects can perform arbitrary actions based on the log message.
They may write the message to a local file, print it to `stderr` or `stdout`,
or send the message to a remote logging service.

`LogHandlers` may perform their own additional log level check, but by default
`LogHandlers` process all messages received at the category they are attached
to.

Motivation
----------

The goal of this logging library is to provide a flexible, easy to use logging
mechanism that allows debug log statements to be used liberally throughout a
code base.

There are two primary design goals for this library:

1. Log statements should be cheap when disabled.
2. It should be easy to control log levels for specific areas of the code base.

While there are a number of other logging libraries for C++, none of the ones I
have seen fulfill both criteria.  The Google logging library (glog) satisfies
the first goal, but not the second.  Most of the other log libraries I have
examined satisfy the second goal, but not the first.

In particular, for item 1, disabled log statements should boil down to a single
conditional check.  Arguments for the log message should not be evaluated if
the log message is not enabled.  Unfortunately, this generally means that
logging must be done using preprocessor macros.

Item 2 largely boils down to having hierarchical logging categories, to allow
easily turning log levels up and down for specific sections of the code base.
For instance, this allows a service to enable a higher log level for its
primary functionality, while having slightly lower levels for libraries that it
depends on.

Other Advantages
----------------

Beyond the primary goals mentioned above, this log library does have some other
advantages over glog:

## Support for using `folly::format()` to generate formatted log messages

Two separate mechanisms are provided for formatting log messages: basic
concatenation of arguments into string (using `folly::to<std::string>()`),
and more flexible formatting using `folly::format()`.  This provides convenient
and type-safe mechanisms for formatting log messages.

## Escapes unprintable characters in log messages by default.

This makes it safer to safer to log arbitrary input data, without worrying if
the data may contain potentially malicious terminal escape sequences.

For instance, this helps avoid vulnerabilities like CVE-2013-1862 and
CVE-2009-4496.

# Support for handling multi-line log messages

The LogMessage class indicates if the message contains internal newlines,
making it easier for handlers to add a log header to each line of the message,
avoiding subsequent lines that do not start with the correct log header.
