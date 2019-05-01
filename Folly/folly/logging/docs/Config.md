Logging Configuration
=====================

Overview
--------

The logging library is normally configured using configuration strings.

In its most basic format, the configuration string consists of a comma
separated list of `CATEGORY=LEVEL` pairs, e.g.:

```
folly=INFO,folly.io.async=DBG2
```

A log level name can also be specified by itself to affect the root log
category:

```
WARN
```

These are the two forms that users will probably use most often for customizing
log levels via command line arguments.  Additional settings, including log
handler settings, can also be included.  The syntax is documented more
completely in the [Basic Configuration Syntax](#basic-configuration-syntax)
section.

Log configuration can also be specified using JSON as well.  If the log
configuration string starts with a leading `{` character (optionally after
leading whitespace), it is parsed as a JSON object.  The JSON configuration
format is documented in the
[JSON Configuration Syntax](#json-configuration-syntax) section.

In general the basic configuration syntax is convenient for controlling log
levels, and making minor log handler setting changes (such as controlling if
logging goes to stdout or stderr, and whether it is logged asynchronously or
not).  However the JSON format is easier to use to describe more complicated
settings.


Basic Configuration Syntax
--------------------------

The basic configuration format is parsed using `parseLogConfig()`.

The basic format string is separated with semicolons.  Everything up to the
first semicolon specifies LogCategory configurations.  Each remaining
semicolon-separated section defines a LogHandler configuration.

To keep the basic format simple, it does not support any form of character
escape sequences.  If you need to define a log category whose name includes a
special character like a comma or semicolon use the JSON format instead.

### Grammar Overview

```
<config> ::= <category_configs> <handler_configs>
<category_configs> ::= <category_config>
                     | <category_config> "," <category_configs>
                     | <empty_string>
<handler_configs> ::= ";" <handler_config>
                    | ";" <handler_config> <handler_configs>
                    | <empty_string>

<category_config> ::= <cat_level_config> <handler_list>
<cat_level_config> ::= <level>
                     | <catgory_name> "=" <level>
                     | <catgory_name> ":=" <level>
<handler_list> ::= ":" <handler_name> <handler_list>
                 | <empty_string>

<handler_config> ::= <handler_name> "=" <handler_type> ":" <handler_options>
                   | <handler_name> ":" <handler_options>
<handler_options> ::= "," <option_name> "=" <option_value> <handler_options>
                    | <empty_string>

<catgory_name> ::= <atom>
<handler_name> ::= <atom>
<handler_type> ::= <atom>
<option_name> ::= <atom>
<option_value> ::= <atom>
<atom> ::= any sequence of characters except ";", ",", "=", or ":",
           with leading and trailing whitespace ignored

<level> ::= <log_level_string>
          | <positive_integer>
<log_level_string> ::= any one of the strings accepted by logLevelToString()
```

### Log Category Configuration

The log category configurations are a comma-separated list.  Each element in
this list has the form

```
NAME=LEVEL:HANDLER1:HANDLER2
```

The log category name and '=' sign can be omitted, in which case the setting
applies to the root log category.  The root log category can also be
explicitly named either using the empty string or the name ".".

The NAME and LEVEL can also be separated with ":=" instead of "=",
which disables log level inheritance for this category.  This forces
category's effective log level to be the exact level specified, even if its
parent category has a more verbose level setting.

The log handler settings for a log category can be omitted, in which case
the existing log handlers for this category will be left unchanged when
updating the LoggerDB settings.  Specifying an empty log handler list (a
trailing ':' with no log handlers following) will cause the log handler list
for this category to be cleared instead.

### Log Handler Configuration

Each log handler configuration section takes the form

```
NAME=TYPE:OPTION1=VALUE1,OPTION2=VALUE2
```

NAME specifies the log handler name, and TYPE specifies the log handler
type.  A comma separated list of name=value options may follow the log
handler name and type.  The option list will be passed to the
LogHandlerFactory for the specified handler type.

The log handler type may be omitted to update the settings of an existing log
handler object:

```
NAME:OPTION1=VALUE1
```

A log handler with this name must already exist.  Options specified in the
configuration will be updated with their new values, and any option names not
mentioned will be left unchanged.


### Examples

Example log configuration strings:

* `ERROR`

  Sets the root log category level to ERR.  (Note that `ERROR` is allowed in
  configuration strings as an alias for the `LogLevel::ERR` value.)

* `folly=INFO,folly.io=DBG2`

  Sets the "folly" log category level to INFO, and the "folly.io" log
  category level to DBG2.

* `folly=DBG2,folly.io:=INFO`

  Sets the "folly" log category level to DBG2, and the "folly.io" log
  category level to INFO, and prevent it from inheriting its effective log
  level from its parent category.  DBG2 log messages sent to "folly.io" will
  therefore be discarded, even though they are enabled for one of its parent
  categories.

* `ERROR:stderr, folly=INFO; stderr=stream:stream=stderr`

  Sets the root log category level to ERROR, and sets its handler list to
  use the "stderr" handler.  Sets the folly log level to INFO.  Defines
  a log handler named "stderr" which writes to stderr.

* `ERROR:x,folly=INFO:y;x=stream:stream=stderr;y=file:path=/tmp/y.log`

  Defines two log handlers: "x" which writes to stderr and "y" which
  writes to the file /tmp/y.log
  Sets the root log catgory level to ERROR, and configures it to use the
  "x" handler.  Sets the log level for the "folly" category to INFO and
  configures it to use the "y" handler.

* `ERROR:default:x; default=stream:stream=stderr; x=file:path=/tmp/x.log`

  Defines two log handlers: "default" which writes to stderr and "x" which
  writes to the file /tmp/x.log
  Sets the root log catgory level to ERROR, and configures it to use both
  the "default" and "x" handlers.

* `ERROR:`

  Sets the root log category level to ERR, and removes any log handlers
  configured for it.  Explicitly specifying an empty list of handlers (with
  a ':' followed by no handlers) will update the handlers for this category
  to the empty list.  Not specifying handler information at all (no ':')
  will leave any pre-existing handlers as-is.

* `;default=stream:stream=stdout`

  Does not change any log category settings, and defines a "default" handler
  that writes to stdout.  This format is useful to update log handler settings
  if the "default" handler already exists and is attached to existing log
  categories.

* `ERROR; stderr:async=true`

  Sets the root log category level to ERR, and sets the "async" property to
  true on the "stderr" handler.  A log handler named "stderr" must already
  exist.  Therefore this configuration string is only valid to use with
  `LoggerDB::updateConfig()`, and cannot be used with
  `LoggerDB::resetConfig()`.

* `INFO; default:async=true,sync_level=WARN`  

  Sets the root log category level to INFO, and sets the "async" property to
  true and "sync_level" property to WARN. Setting "async" property ensures that
  we enable asynchronous logging but the "sync_level" flag specifies that all
  logs of the level WARN and above are processed synchronously. This can help
  ensure that all logs of the level WARN or above are persisted before a
  potential crash while ensuring that all logs below the level WARN are
  non-blocking.

JSON Configuration Syntax
-------------------------

The `parseLogConfig()` function, which parses the basic configuration string
syntax, will also accept a JSON object string as input.  However, you can also
use `parseLogConfigJson()` to explicitly parse the input as JSON, and not
accept the basic configuration string syntax.

The input string is parsed using relaxed JSON parsing, allowing C and C++ style
comments, as well as trailing commas.

The JSON configuration string must be a JSON object data type, with two
optional members: `categories` and `handlers`.  Any additional members besides
these two are ignored.

### Log Category Configuration

If present, the `categories` member of the top-level object should be a JSON
object mapping log category names to configuration settings for that log
category.

The value of each element in `categories` should also be a JSON object with the
following fields:

* `level`

  This field is required.  It should be a string or positive integer value
  specifying the log level for this category.

* `inherit`

  This should be a boolean value indicating if this category should inherit its
  effective log level from its parent category if its parent has a more verbose
  log level setting.

  This field is optional, and defaults to true if not present.

Alternatively, the value for a log category may be a plain string or integer
instead of a JSON object, in which case case the string or integer is treated
as the log level for that category, with the inherit setting enabled.

### Log Handler Configuration

If present, the `handlers` member of the top-level object should be a JSON
object mapping log handler names to configuration settings for that log
handler.

The value of each element in `handlers` should also be a JSON object with the
following fields:

* `type`

  This field should be a string containing the name of the log handler type.
  This type name must correspond to `LogHandlerFactory` type registered with
  the `LoggerDB`.

  If this field is not present then this configuration will be used to update
  an existing log handler.  A log handler with this name must already exist.
  The values from the `options` field will be merged into the existing log
  handler options.

* `options`

  This field is optional.  If present, it should be a JSON object containing
  string-to-string mappings to be passed to the `LogHandlerFactory` for
  constructing this log handler.

### Example

```javascript
{
  "categories": {
    "foo": { "level": "INFO", "handlers": ["stderr"] },
    "foo.only_fatal": { "level": "FATAL", "inherit": false }
  }
  "handlers": {
    "stderr": {
      "type": "stream",
      "options": {
        "stream": "stderr",
        "async": true,
        "sync_level": "WARN",
        "max_buffer_size": 4096000
      }
    }
  }
}
```


Custom Configuration Mechanisms
-------------------------------

Internally the the `LogConfig` class represents configuration settings for the
folly logging library.  Users of the logging library can also programmatically
construct their own `LogConfig` objects and use the `LoggerDB::updateConfig()`
and `LoggerDB::resetConfig()` APIs to apply the configuration changes.

You can also directly manipulate the log level and other settings on
`LogCategory` objects.

While it is possible to also manually create new `LogHandler` objects, it is
generally preferred to do this using the `LoggerDB::updateConfig()` and
`LoggerDB::resetConfig()` APIs.  If you manually create a new `LogHandler` and
directly attach it to some categories the `LoggerDB::getConfig()` call will not
be able to return complete information for your manually created log handler,
since it does not have a name or handler type that can be included in the
configuration.
