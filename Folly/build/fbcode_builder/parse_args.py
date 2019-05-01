#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
'Argument parsing logic shared by all fbcode_builder CLI tools.'

import argparse
import logging

from shell_quoting import raw_shell, ShellQuoted


def parse_args_to_fbcode_builder_opts(add_args_fn, top_level_opts, opts, help):
    '''

    Provides some standard arguments: --debug, --option, --shell-quoted-option

    Then, calls `add_args_fn(parser)` to add application-specific arguments.

    `opts` are first used as defaults for the various command-line
    arguments.  Then, the parsed arguments are mapped back into `opts`,
    which then become the values for `FBCodeBuilder.option()`, to be used
    both by the builder and by `get_steps_fn()`.

    `help` is printed in response to the `--help` argument.

    '''
    top_level_opts = set(top_level_opts)

    parser = argparse.ArgumentParser(
        description=help,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    add_args_fn(parser)

    parser.add_argument(
        '--option', nargs=2, metavar=('KEY', 'VALUE'), action='append',
        default=[
            (k, v) for k, v in opts.items()
                if k not in top_level_opts and not isinstance(v, ShellQuoted)
        ],
        help='Set project-specific options. These are assumed to be raw '
            'strings, to be shell-escaped as needed. Default: %(default)s.',
    )
    parser.add_argument(
        '--shell-quoted-option', nargs=2, metavar=('KEY', 'VALUE'),
        action='append',
        default=[
            (k, raw_shell(v)) for k, v in opts.items()
                if k not in top_level_opts and isinstance(v, ShellQuoted)
        ],
        help='Set project-specific options. These are assumed to be shell-'
            'quoted, and may be used in commands as-is. Default: %(default)s.',
    )

    parser.add_argument('--debug', action='store_true', help='Log more')
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format='%(levelname)s: %(message)s'
    )

    # Map command-line args back into opts.
    logging.debug('opts before command-line arguments: {0}'.format(opts))

    new_opts = {}
    for key in top_level_opts:
        val = getattr(args, key)
        # Allow clients to unset a default by passing a value of None in opts
        if val is not None:
            new_opts[key] = val
    for key, val in args.option:
        new_opts[key] = val
    for key, val in args.shell_quoted_option:
        new_opts[key] = ShellQuoted(val)

    logging.debug('opts after command-line arguments: {0}'.format(new_opts))

    return new_opts
