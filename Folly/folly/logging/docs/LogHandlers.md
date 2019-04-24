# Log Handlers

The `LogHandler` class defines the interface for classes that wish to be
notified of log messages.

`LogHandler` objects can be attached to specific log categories to be notified
about log messages sent to that category or any of its children categories.
Attaching a `LogHandler` to the root category will cause it to be notified
about every enabled log message.


# Built-in Log Handlers

The logging library currently provides a few basic built-in `LogHandler`
implementations.

## `stream` Handler Type

In the [configuration settings](Config.md), you can use the `stream` type to
define a log handler that will write to `stdout` or `stderr`.  The `stream`
property of the log handler specifies which stream to write to.  For example,
the following defines a handler named `myhandler` that writes to stderr

```
myhandler=stream:stream=stderr
```

## `file` Handler Type

A `file` handler type is also provided that appends log messages to a file on
disk.  The `path` option controls which file to write to.  For example:

```
myhandler=file:path=/var/log/my.log
```

However, note that the `file` handler is currently not registered by default by
`folly::initLogging()`.  This log handler allows appending to arbitrary files
based on the configuration settings.  You should only enable this handler type
if you trust the source of your configuration string.  (For instance, this
handler is potentially unsafe if your program runs with elevated privileges but
users with lower privilege levels can write to your configuration file.)

The following code snippet can be used to explicitly enable this log handler
type.  It can be called before `initLogging()` to support the `file` handler
type in the configuration string passed to `initLogging()`.

```
folly::LoggerDB::get()->registerHandlerFactory(
      std::make_unique<folly::FileHandlerFactory>());

```

## Handler Options

The built-in handler types also accept several options to control their
behavior.  These include:

### `async`

The `async` option controls whether log messages should be written
asynchronously in a separate thread (when `async` is true) or immediately in
the thread that generated the log messages (when `async` is false).

This mainly affects the behavior when log messages are being generated faster
than they can be written to the output file or stream:

* Using `async=true` will ensure that your program never blocks waiting to
  write the messages.  Instead, the handler will start dropping log messages
  when this occurs.  When it is able to catch up it will emit a message
  indicating how many messages were dropped.

* Using `async=false` will ensure that no log messages are dropped, at the
  expense of blocking your program's normal processing until the log messages
  can be written.

One additional consideration is that `async=false` will ensure that all log
messages have been flushed if your program crashes.  With `async=true` it is
possible to lose some recent messages on program crash.  For instance, if one
thread logs a message and then dereferences a null pointer, `async=false` will
ensure that the log message has been flushed before the thread can proceed to
dereference the null pointer.  However with `async=true` the logging I/O thread
may not have flushed the log message by the time the thread that generated the
message crashes.

With `async=true`, the `max_buffer_size` option controls how much log data may
buffered in memory before dropping new log messages.  This option specifies the
maximum number of bytes of unflushed log data to keep.  New log messages that
would trigger this limit to be exceeded will be discarded.  (Log messages are
either entirely kept or discarded; partial messages are never kept.)

### `formatter`

The `formatter` parameter controls how log messages should be formatted.

Currently the only built-in log formatter is `glog`, which formats log messages
similarly to [glog](https://github.com/google/glog).  Additional formatters may
be added in the future, and it is also possible to implement your own
`LogFormatter` class.


# Default Handler Configuration

By default `initLogging()` creates a single log handler named `default`.
This log handler is installed on the root log category, and logs all messages
to stderr using a message format similar to that used by
[glog](https://github.com/google/glog).

This `default` log handler has the `async` option disabled by default.  This
means that `initLogging()` will not spawn a separate logging I/O thread by
default.  However, log messages may delay normal program processing if they are
being generated faster than they can be written to stderr.

High performance programs that want to avoid performance hiccups caused by
logging may wish to enable the `async` option on the default log handler.
This can easily be changed with the logging configuration string.  For
instance, the following string sets the root category's log level to `WARN` and
enables the `async` option on the default log handler:

```
WARN; default:async=true
```


# Custom Log Handlers

It is possible to define your own custom `LogHandler` class should you choose
to.  The `LogHandlerFactory` API enables you to create your own custom
`LogHandler` types from configuration settings parsed by `parseLogConfig()`.
You can use `LoggerDB::get()->registerHandlerFactory()` to register your own
custom log handler type.

## `StandardLogHandler`

The `StandardLogHandler` class is an implementation of `LogHandler` that
splits log message processing into two steps: formatting the message to a
string, and then writing that string somewhere.

It uses a `LogFormatter` class to perform the message formatting, and a
`LogWriter` class to write the formatted message.

You can provide only a custom `LogFormatter` or `LogWriter` implementation if
you want to customize one of these two steps without providing a full
`LogHandler` implementation of your own.

The `StandardLogHandlerFactory` class can then be used to implement your own
custom `LogHandlerFactory` that creates a `StandardLogHandler` with your custom
log formatter or writer type.
