# Log Levels

The available log levels are defined in `logging/LogLevel.h`

### `FATAL`

A message logged with the `FATAL` log level will abort your program.  `FATAL`
log messages cannot be disabled.  If you have no log handlers configured when a
`FATAL` message is logged it will be printed to stderr, to ensure that your
program does not abort silently.

### `DFATAL`

The `DFATAL` log level is similar to `FATAL`, but only aborts your program in
debug builds (if the `NDEBUG` preprocessor macro was not defined at build
time).

### `CRITICAL`

`CRITICAL` is intended for important error messages.  It falls in between `ERR`
and `FATAL`.

### `ERR`

`ERR` is intended for error messages.  This category is named `ERR` rather than
`ERROR` due to the fact that common Windows header files `#define ERROR` as a
preprocessor macro.

### `WARN`, aka `WARNING`

`WARN` is intended for warning messages.  `WARNING` is accepted as an alternate
name for `WARN`.

### `INFO`

`INFO` is intended for informational messages.

### `DBG0` through `DBG9`

There are 10 numbered debug message categories, `DBG0`, `DBG1`, `DBG2`, ...,
`DBG9`.

Note that `DBG0` is a more important log level than `DBG9`.  The number next to
the debug level can be thought of as its verbosity: the higher the debug level
the more verbose it is.  Setting a log category's level to `DBG5` will enable
log messages with levels `DBG0` through `DBG5` (as well as higher levels such
as `INFO` and above), while messages at level `DBG6` through `DBG9` will be
disabled.

### `DEBUG`

The `DEBUG` category falls below `DBG9`.

Setting a log category's level to `DEBUG` will automatically enable all
numbered `DBG` levels.
