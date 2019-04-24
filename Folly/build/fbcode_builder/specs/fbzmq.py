#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import specs.fbthrift as fbthrift
import specs.folly as folly
import specs.gmock as gmock
import specs.sodium as sodium
import specs.sigar as sigar

from shell_quoting import ShellQuoted


def fbcode_builder_spec(builder):
    builder.add_option('zeromq/libzmq:git_hash', 'v4.2.5')
    return {
        'depends_on': [folly, fbthrift, gmock, sodium, sigar],
        'steps': [
            builder.github_project_workdir('zeromq/libzmq', '.'),
            builder.step('Build and install zeromq/libzmq', [
                builder.run(ShellQuoted('./autogen.sh')),
                builder.configure(),
                builder.make_and_install(),
            ]),

            builder.fb_github_project_workdir('fbzmq/fbzmq/build', 'facebook'),
            builder.step('Build and install fbzmq/fbzmq/build', [
                builder.cmake_configure('fbzmq/fbzmq/build'),
                # we need the pythonpath to find the thrift compiler
                builder.run(ShellQuoted(
                    'PYTHONPATH="$PYTHONPATH:"{p}/lib/python2.7/site-packages '
                    'make -j {n}'
                ).format(p=builder.option('prefix'), n=builder.option('make_parallelism'))),
                builder.run(ShellQuoted('make install')),
            ]),
        ],
    }
