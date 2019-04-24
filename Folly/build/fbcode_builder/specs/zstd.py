#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

from shell_quoting import ShellQuoted


def fbcode_builder_spec(builder):
    # This API should change rarely, so build the latest tag instead of master.
    builder.add_option(
        'facebook/zstd:git_hash',
        ShellQuoted('$(git describe --abbrev=0 --tags origin/master)')
    )
    return {
        'steps': [
            builder.github_project_workdir('facebook/zstd', '.'),
            builder.step('Build and install zstd', [
                builder.make_and_install(make_vars={
                    'PREFIX': builder.option('prefix'),
                })
            ]),
        ],
    }
