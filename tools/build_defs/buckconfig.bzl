# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def read(section, field, default = None):
    """Read a `string` from `.buckconfig`."""

    return native.read_config(section, field, default)

def read_bool(section, field, default = None, required = True):
    """Read a `boolean` from `.buckconfig`."""

    # Treat the empty string as "unset".  This allows the user to "override" a
    # previous setting by "clearing" it out.
    val = read(section, field)
    if val != None and val != "":
        # Fast-path string check
        if val == "True" or val == "true":
            return True
        elif val == "False" or val == "false":
            return False

        # Else fall back to lower casing
        if val.lower() == "true":
            return True
        elif val.lower() == "false":
            return False
        else:
            fail(
                "`{}:{}`: cannot coerce {!r} to bool".format(section, field, val),
            )
    elif default != None:
        return default
    elif not required:
        return None
    else:
        fail("`{}:{}`: no value set".format(section, field))
