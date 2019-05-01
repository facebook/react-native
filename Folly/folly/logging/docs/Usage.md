# Usage

Logging messages with the folly logging library is done with one of a handful
of log macros.  Macros are used to allow lazily evaluating the log arguments:
if the log message is disabled the log message expression will not be executed.

# Logging Macros

## `XLOG()`

In most cases, if you want to log a message you will use the `XLOG()` macro:

```
XLOG(INFO) << "hello world!";
```

This macro is defined in `folly/logging/xlog.h`

## `FB_LOG()`

The `XLOG()` macro automatically chooses the log category based on the current
file name.  However, if you want to log to an explicit log category, you can
use `FB_LOG()`.  It behaves like `XLOG()`, except that it requires a
`folly::Logger` as is first argument to specify the log category:

```
folly::Logger eventLogger("eden.events");

FB_LOG(eventLogger, INFO) << "something happened";
```

`FB_LOG()` is defined in `folly/logging/Logger.h`

## Macro Arguments

The `XLOG()` macro takes a log level as its first argument.  See the
[Log Levels](LogLevels.md) document for a list of available log levels.

If you supply additional arguments they will be converted to strings using
`folly::to<std::string>()` and concatenated together as part of the log
message.  For example:

```
XLOG(INFO, "the number is ", 2 + 2);
```

will result in the message "the number is 4".

If desired, you can specify both function argument style and `ostream` style
streaming log arguments together:

```
XLOG(INFO, "the number is ") <<  2 + 2);
```

The `FB_LOG()` macro accepts requires a `Logger` object as its first argument,
and all subsequent arguments behave the same as the arguments to `XLOG()`.

## Python-style string formatting

The `XLOGF()` and `FB_LOGF()` macros allow log messages to be formatted using
format strings similar to python's
[str.format()](https://docs.python.org/3/library/string.html#formatspec)
mechanism.

```
XLOGF(DBG1, "cannot engage {} thruster: {}", thruster.name(), err.what());
```

This uses [`folly::format()`](https://github.com/facebook/folly/blob/master/folly/docs/Format.md)
to perform the formatting internally.

## `printf`-style string formatting

To help existing projects convert from older logging APIs, `XLOGC()` and
`FB_LOGC()` macros exist to support C-style `printf()` format strings.
You must include `folly/logging/printf.h` to access these macros.

```
XLOGC(DBG1, "failed to engage thruster %d: %s", thruster.number(), err.what());
```

# Log Category Selection

The `XLOG()` macro automatically selects a log category to log to based on the
current source file name.  Directory separators in the path are replaced with
`.` characters to compute the log category name.

For instance, in a source file named `src/tiefighter/thruster.cpp` the default
`XLOG()` category will be `src.tiefighter.thruster.cpp`

Inside `.cpp` files the default `XLOG()` category name can be overridden using
the `XLOG_SET_CATEGORY_NAME()` macro.  `XLOG_SET_CATEGORY_NAME()` can be
specified at top-level scope in the `.cpp` file to specify an alternate
category name for all `XLOG()` statements in this file.
`XLOG_SET_CATEGORY_NAME()` should not be used in header files, since it would
end up affecting all `.cpp` files that include that header.

# Configuration

The logging library provides several APIs for configuring log categories and
handlers.  While you can programmatically configure `LogCategory` and
`LogHandler` objects via their public APIs, there are also APIs to configure
the logging library via configuration strings.

`folly::parseLogConfig()` can parse a configuration string in to a `LogConfig`
object.  The configuration string syntax is documented in
[Config.md](Config.md).

You can then apply a `LogConfig` object to the main `LoggerDB` singleton by
using `LoggerDB::get()->updateConfig()` to incrementally update the current
configuration, or by using `LoggerDB::get()->resetConfig()` to replace all
existing settings with the new configuration.

The `folly::initLogging()` function provides a convenient API for initially
configuring the logging library from a configuration string that was obtained
from a command line flag or configuration file.
