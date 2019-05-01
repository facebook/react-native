#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

'''
shell_builder.py allows running the fbcode_builder logic
on the host rather than in a container.

It emits a bash script with set -exo pipefail configured such that
any failing step will cause the script to exit with failure.

== How to run it? ==

cd build
python fbcode_builder/shell_builder.py > ~/run.sh
bash ~/run.sh
'''

import os
import distutils.spawn

from fbcode_builder import FBCodeBuilder
from shell_quoting import (
    raw_shell, shell_comment, shell_join, ShellQuoted
)
from utils import recursively_flatten_list


class ShellFBCodeBuilder(FBCodeBuilder):
    def _render_impl(self, steps):
        return raw_shell(shell_join('\n', recursively_flatten_list(steps)))

    def workdir(self, dir):
        return [
            ShellQuoted('mkdir -p {d} && cd {d}').format(
                d=dir
            ),
        ]

    def run(self, shell_cmd):
        return ShellQuoted('{cmd}').format(cmd=shell_cmd)

    def step(self, name, actions):
        assert '\n' not in name, 'Name {0} would span > 1 line'.format(name)
        b = ShellQuoted('')
        return [ShellQuoted('### {0} ###'.format(name)), b] + actions + [b]

    def setup(self):
        steps = [
            ShellQuoted('set -exo pipefail'),
        ]
        if self.has_option('ccache_dir'):
            ccache_dir = self.option('ccache_dir')
            steps += [
                ShellQuoted(
                    # Set CCACHE_DIR before the `ccache` invocations below.
                    'export CCACHE_DIR={ccache_dir} '
                    'CC="ccache ${{CC:-gcc}}" CXX="ccache ${{CXX:-g++}}"'
                ).format(ccache_dir=ccache_dir)
            ]
        return steps

    def comment(self, comment):
        return shell_comment(comment)

    def copy_local_repo(self, dir, dest_name):
        return [
            ShellQuoted('cp -r {dir} {dest_name}').format(
                dir=dir,
                dest_name=dest_name
            ),
        ]


def find_project_root():
    here = os.path.dirname(os.path.realpath(__file__))
    maybe_root = os.path.dirname(os.path.dirname(here))
    if os.path.isdir(os.path.join(maybe_root, '.git')):
        return maybe_root
    raise RuntimeError(
        "I expected shell_builder.py to be in the "
        "build/fbcode_builder subdir of a git repo")


def persistent_temp_dir(repo_root):
    escaped = repo_root.replace('/', 'sZs').replace('\\', 'sZs').replace(':', '')
    return os.path.join(os.path.expandvars("$HOME"), '.fbcode_builder-' + escaped)


if __name__ == '__main__':
    from utils import read_fbcode_builder_config, build_fbcode_builder_config
    repo_root = find_project_root()
    temp = persistent_temp_dir(repo_root)

    config = read_fbcode_builder_config('fbcode_builder_config.py')
    builder = ShellFBCodeBuilder()

    builder.add_option('projects_dir', temp)
    if distutils.spawn.find_executable('ccache'):
        builder.add_option('ccache_dir',
            os.environ.get('CCACHE_DIR', os.path.join(temp, '.ccache')))
    builder.add_option('prefix', os.path.join(temp, 'installed'))
    builder.add_option('make_parallelism', 4)
    builder.add_option(
        '{project}:local_repo_dir'.format(project=config['github_project']),
        repo_root)
    make_steps = build_fbcode_builder_config(config)
    steps = make_steps(builder)
    print(builder.render(steps))
