# Log Categories

Each log message is logged to a specific log category.

Log categories have a level setting that controls what log messages should be
enabled for this category, as well as a list of log handlers that control what
should be done with enabled log messages.

# Log Category Hierarchy

Log categories are arranged in a hierarchy.  Each log category except for the
root has a parent category, and they may have zero or more children categories.

The log category hierarchy is determined by category names: the `.`
character acts as a separator in category names.  For example, the category
`spacesim` is the parent of the category `spacesim.ships`.  The root category
can be referred to either as `.` or as the empty string.

One recommended option for choosing log category names is to follow the source
code directory structure.  For example, a partial view of the log category
hierarchy for a space simulator project might look something like:

```
. --- spacesim --- ships --- corvette -- cpp
               \         \            \- h
               |          \- cruiser -- cpp
               |                     \- h
               |
                \- actors --- player -- cpp
                          \          \- h
                           \- ai --- enemy -- cpp
                                           \- h
```

The `XLOG()` macro automatically selects the log category to use based on the
source file path.

# Log Level Propagation

Log level settings automatically propagates downward from a particular log
category to its children.

If the log verbosity is increased on a particular log category (by lowering the
minimum enabled log level) , all of its children also inherit that increased
log verbosity by default.  For instance, setting the log level to `INFO` on
`spacesim.ships` will automatically enable `INFO` and higher log messages on
the `spacesim.ships` category as well as children categories such as
`spacesim.ships.corvette`, `spacesim.ships.fighter`, etc.  This makes it easily
possible to control the log verbosity of entire sections of the code base at
once.

Log level propagation can be disabled on specific categories by turning off the
`inherit` setting for that category.  For instance, disabling the `inherit`
setting on the `spacesim.ships.cruiser` category will prevent it form
inheriting increased log level verbosity from its parent `spacesim.ships`
category (or indirectly inheriting settings from `spacesim` or the root
category).  This makes it possible to turn down the verbosity for specific
categories even if when a larger category they belong to does have a higher
verbosity setting.

# Log Message Propagation

Logged messages propagate upwards through the log category hierarchy.

For instance, a message logged to `spacesim.ships.corvette.cpp` will first be
sent to any `LogHandler` objects configured on `spacesim.ship.corvette.cpp`,
then to the handlers for `spacesim.ships.corvette`, then `spacesim.ships`, then
to `spacesim`, and finally to the handlers for the root log category.

Due to this behavior, if you install a `LogHandler` on the root log category it
will automatically receive all messages logged to any category.  Installing
`LogHandler` objects on sub-categories allows you to perform handling only for
specific category messages.  `LogHandler` objects receive the full `LogMessage`
object, and can perform further filtering based on the log level or other
message properties if desired.

The [Log Handler](LogHandlers.md) documentation provides additional details
about log handler behavior.
