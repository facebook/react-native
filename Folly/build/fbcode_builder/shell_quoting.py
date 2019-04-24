#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
'''

Almost every FBCodeBuilder string is ultimately passed to a shell. Escaping
too little or too much tends to be the most common error.  The utilities in
this file give a systematic way of avoiding such bugs:
 - When you write literal strings destined for the shell, use `ShellQuoted`.
 - When these literal strings are parameterized, use `ShellQuoted.format`.
 - Any parameters that are raw strings get `shell_quote`d automatically,
   while any ShellQuoted parameters will be left intact.
 - Use `path_join` to join path components.
 - Use `shell_join` to join already-quoted command arguments or shell lines.

'''

import os

from collections import namedtuple


class ShellQuoted(namedtuple('ShellQuoted', ('do_not_use_raw_str',))):
    '''

    Wrap a string with this to make it transparent to shell_quote().  It
    will almost always suffice to use ShellQuoted.format(), path_join(),
    or shell_join().

    If you really must, use raw_shell() to access the raw string.

    '''

    def __new__(cls, s):
        'No need to nest ShellQuoted.'
        return super(ShellQuoted, cls).__new__(
            cls, s.do_not_use_raw_str if isinstance(s, ShellQuoted) else s
        )

    def __str__(self):
        raise RuntimeError(
            'One does not simply convert {0} to a string -- use path_join() '
            'or ShellQuoted.format() instead'.format(repr(self))
        )

    def __repr__(self):
        return '{0}({1})'.format(
            self.__class__.__name__, repr(self.do_not_use_raw_str)
        )

    def format(self, **kwargs):
        '''

        Use instead of str.format() when the arguments are either
        `ShellQuoted()` or raw strings needing to be `shell_quote()`d.

        Positional args are deliberately not supported since they are more
        error-prone.

        '''
        return ShellQuoted(self.do_not_use_raw_str.format(**dict(
            (k, shell_quote(v).do_not_use_raw_str) for k, v in kwargs.items()
        )))


def shell_quote(s):
    'Quotes a string if it is not already quoted'
    return s if isinstance(s, ShellQuoted) \
        else ShellQuoted("'" + str(s).replace("'", "'\\''") + "'")


def raw_shell(s):
    'Not a member of ShellQuoted so we get a useful error for raw strings'
    if isinstance(s, ShellQuoted):
        return s.do_not_use_raw_str
    raise RuntimeError('{0} should have been ShellQuoted'.format(s))


def shell_join(delim, it):
    'Joins an iterable of ShellQuoted with a delimiter between each two'
    return ShellQuoted(delim.join(raw_shell(s) for s in it))


def path_join(*args):
    'Joins ShellQuoted and raw pieces of paths to make a shell-quoted path'
    return ShellQuoted(os.path.join(*[
        raw_shell(shell_quote(s)) for s in args
    ]))


def shell_comment(c):
    'Do not shell-escape raw strings in comments, but do handle line breaks.'
    return ShellQuoted('# {c}').format(c=ShellQuoted(
        (raw_shell(c) if isinstance(c, ShellQuoted) else c)
            .replace('\n', '\n# ')
    ))
