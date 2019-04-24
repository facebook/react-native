#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

from shell_quoting import ShellQuoted


def fbcode_builder_spec(builder):
    builder.add_option('jedisct1/libsodium:git_hash', 'stable')
    return {
        'steps': [
            builder.github_project_workdir('jedisct1/libsodium', '.'),
            builder.step('Build and install jedisct1/libsodium', [
                builder.run(ShellQuoted('./autogen.sh')),
                builder.configure(),
                builder.make_and_install(),
            ]),
        ],
    }
