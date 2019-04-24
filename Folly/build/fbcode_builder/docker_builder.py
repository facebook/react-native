#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
'''

Extends FBCodeBuilder to produce Docker context directories.

In order to get the largest iteration-time savings from Docker's build
caching, you will want to:
 - Use fine-grained steps as appropriate (e.g. separate make & make install),
 - Start your action sequence with the lowest-risk steps, and with the steps
   that change the least often, and
 - Put the steps that you are debugging towards the very end.

'''
import logging
import os
import shutil
import tempfile

from fbcode_builder import FBCodeBuilder
from shell_quoting import (
    raw_shell, shell_comment, shell_join, ShellQuoted
)
from utils import recursively_flatten_list, run_command


class DockerFBCodeBuilder(FBCodeBuilder):

    def _user(self):
        return self.option('user', 'root')

    def _change_user(self):
        return ShellQuoted('USER {u}').format(u=self._user())

    def setup(self):
        # Please add RPM-based OSes here as appropriate.
        #
        # To allow exercising non-root installs -- we change users after the
        # system packages are installed.  TODO: For users not defined in the
        # image, we should probably `useradd`.
        return self.step('Setup', [
            # Docker's FROM does not understand shell quoting.
            ShellQuoted('FROM {}'.format(self.option('os_image'))),
            # /bin/sh syntax is a pain
            ShellQuoted('SHELL ["/bin/bash", "-c"]'),
        ] + self.install_debian_deps() + [self._change_user()])

    def step(self, name, actions):
        assert '\n' not in name, 'Name {0} would span > 1 line'.format(name)
        b = ShellQuoted('')
        return [ShellQuoted('### {0} ###'.format(name)), b] + actions + [b]

    def run(self, shell_cmd):
        return ShellQuoted('RUN {cmd}').format(cmd=shell_cmd)

    def workdir(self, dir):
        return [
            # As late as Docker 1.12.5, this results in `build` being owned
            # by root:root -- the explicit `mkdir` works around the bug:
            #   USER nobody
            #   WORKDIR build
            ShellQuoted('USER root'),
            ShellQuoted('RUN mkdir -p {d} && chown {u} {d}').format(
                d=dir, u=self._user()
            ),
            self._change_user(),
            ShellQuoted('WORKDIR {dir}').format(dir=dir),
        ]

    def comment(self, comment):
        # This should not be a command since we don't want comment changes
        # to invalidate the Docker build cache.
        return shell_comment(comment)

    def copy_local_repo(self, repo_dir, dest_name):
        fd, archive_path = tempfile.mkstemp(
            prefix='local_repo_{0}_'.format(dest_name),
            suffix='.tgz',
            dir=os.path.abspath(self.option('docker_context_dir')),
        )
        os.close(fd)
        run_command('tar', 'czf', archive_path, '.', cwd=repo_dir)
        return [
            ShellQuoted('ADD {archive} {dest_name}').format(
                archive=os.path.basename(archive_path), dest_name=dest_name
            ),
            # Docker permissions make very little sense... see also workdir()
            ShellQuoted('USER root'),
            ShellQuoted('RUN chown -R {u} {d}').format(
                d=dest_name, u=self._user()
            ),
            self._change_user(),
        ]

    def _render_impl(self, steps):
        return raw_shell(shell_join('\n', recursively_flatten_list(steps)))

    def debian_ccache_setup_steps(self):
        source_ccache_tgz = self.option('ccache_tgz', '')
        if not source_ccache_tgz:
            logging.info('Docker ccache not enabled')
            return []

        dest_ccache_tgz = os.path.join(
            self.option('docker_context_dir'), 'ccache.tgz'
        )

        try:
            try:
                os.link(source_ccache_tgz, dest_ccache_tgz)
            except OSError:
                logging.exception(
                    'Hard-linking {s} to {d} failed, falling back to copy'
                    .format(s=source_ccache_tgz, d=dest_ccache_tgz)
                )
                shutil.copyfile(source_ccache_tgz, dest_ccache_tgz)
        except Exception:
            logging.exception(
                'Failed to copy or link {s} to {d}, aborting'
                .format(s=source_ccache_tgz, d=dest_ccache_tgz)
            )
            raise

        return [
            # Separate layer so that in development we avoid re-downloads.
            self.run(ShellQuoted('apt-get install -yq ccache')),
            ShellQuoted('ADD ccache.tgz /'),
            ShellQuoted(
                # Set CCACHE_DIR before the `ccache` invocations below.
                'ENV CCACHE_DIR=/ccache '
                # No clang support for now, so it's easiest to hardcode gcc.
                'CC="ccache gcc" CXX="ccache g++" '
                # Always log for ease of debugging. For real FB projects,
                # this log is several megabytes, so dumping it to stdout
                # would likely exceed the Travis log limit of 4MB.
                #
                # On a local machine, `docker cp` will get you the data.  To
                # get the data out from Travis, I would compress and dump
                # uuencoded bytes to the log -- for Bistro this was about
                # 600kb or 8000 lines:
                #
                #   apt-get install sharutils
                #   bzip2 -9 < /tmp/ccache.log | uuencode -m ccache.log.bz2
                'CCACHE_LOGFILE=/tmp/ccache.log'
            ),
            self.run(ShellQuoted(
                # Future: Skipping this part made this Docker step instant,
                # saving ~1min of build time.  It's unclear if it is the
                # chown or the du, but probably the chown -- since a large
                # part of the cost is incurred at image save time.
                #
                # ccache.tgz may be empty, or may have the wrong
                # permissions.
                'mkdir -p /ccache && time chown -R nobody /ccache && '
                'time du -sh /ccache && '
                # Reset stats so `docker_build_with_ccache.sh` can print
                # useful values at the end of the run.
                'echo === Prev run stats === && ccache -s && ccache -z && '
                # Record the current time to let travis_build.sh figure out
                # the number of bytes in the cache that are actually used --
                # this is crucial for tuning the maximum cache size.
                'date +%s > /FBCODE_BUILDER_CCACHE_START_TIME && '
                # The build running as `nobody` should be able to write here
                'chown nobody /tmp/ccache.log'
            )),
        ]
