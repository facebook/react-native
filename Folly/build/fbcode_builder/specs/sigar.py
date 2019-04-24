#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

from shell_quoting import ShellQuoted


def fbcode_builder_spec(builder):
    builder.add_option(
        'hyperic/sigar:autoconf_options', {'CFLAGS' : '-fgnu89-inline'})
    return {
        'steps': [
            builder.github_project_workdir('hyperic/sigar', '.'),
            builder.step('Build and install sigar', [
                builder.run(ShellQuoted('./autogen.sh')),
                builder.configure('hyperic/sigar'),
                builder.make_and_install(),
            ]),
        ],
    }
