#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
'''

This is a small DSL to describe builds of Facebook's open-source projects
that are published to Github from a single internal repo, including projects
that depend on folly, wangle, proxygen, fbthrift, etc.

This file defines the interface of the DSL, and common utilieis, but you
will have to instantiate a specific builder, with specific options, in
order to get work done -- see e.g. make_docker_context.py.

== Design notes ==

Goals:

 - A simple declarative language for what needs to be checked out & built,
   how, in what order.

 - The same specification should work for external continuous integration
   builds (e.g. Travis + Docker) and for internal VM-based continuous
   integration builds.

 - One should be able to build without root, and to install to a prefix.

Non-goals:

 - General usefulness. The only point of this is to make it easier to build
   and test Facebook's open-source services.

Ideas for the future -- these may not be very good :)

 - Especially on Ubuntu 14.04 the current initial setup is inefficient:
   we add PPAs after having installed a bunch of packages -- this prompts
   reinstalls of large amounts of code.  We also `apt-get update` a few
   times.

 - A "shell script" builder. Like DockerFBCodeBuilder, but outputs a
   shell script that runs outside of a container. Or maybe even
   synchronously executes the shell commands, `make`-style.

 - A "Makefile" generator. That might make iterating on builds even quicker
   than what you can currently get with Docker build caching.

 - Generate a rebuild script that can be run e.g. inside the built Docker
   container by tagging certain steps with list-inheriting Python objects:
     * do change directories
     * do NOT `git clone` -- if we want to update code this should be a
       separate script that e.g. runs rebase on top of specific targets
       across all the repos.
     * do NOT install software (most / all setup can be skipped)
     * do NOT `autoreconf` or `configure`
     * do `make` and `cmake`

 - If we get non-Debian OSes, part of ccache setup should be factored out.
'''

import os
import re

from shell_quoting import path_join, shell_join, ShellQuoted


def _read_project_github_hashes():
    base_dir = 'deps/github_hashes/'  # trailing slash used in regex below
    for dirname, _, files in os.walk(base_dir):
        for filename in files:
            path = os.path.join(dirname, filename)
            with open(path) as f:
                m_proj = re.match('^' + base_dir + '(.*)-rev\.txt$', path)
                if m_proj is None:
                    raise RuntimeError('Not a hash file? {0}'.format(path))
                m_hash = re.match('^Subproject commit ([0-9a-f]+)\n$', f.read())
                if m_hash is None:
                    raise RuntimeError('No hash in {0}'.format(path))
                yield m_proj.group(1), m_hash.group(1)


class FBCodeBuilder(object):

    def __init__(self, **kwargs):
        self._options_do_not_access = kwargs  # Use .option() instead.
        # This raises upon detecting options that are specified but unused,
        # because otherwise it is very easy to make a typo in option names.
        self.options_used = set()
        self._github_hashes = dict(_read_project_github_hashes())

    def __repr__(self):
        return '{0}({1})'.format(
            self.__class__.__name__,
            ', '.join(
                '{0}={1}'.format(k, repr(v))
                    for k, v in self._options_do_not_access.items()
            )
        )

    def option(self, name, default=None):
        value = self._options_do_not_access.get(name, default)
        if value is None:
            raise RuntimeError('Option {0} is required'.format(name))
        self.options_used.add(name)
        return value

    def has_option(self, name):
        return name in self._options_do_not_access

    def add_option(self, name, value):
        if name in self._options_do_not_access:
            raise RuntimeError('Option {0} already set'.format(name))
        self._options_do_not_access[name] = value

    #
    # Abstract parts common to every installation flow
    #

    def render(self, steps):
        '''

        Converts nested actions to your builder's expected output format.
        Typically takes the output of build().

        '''
        res = self._render_impl(steps)  # Implementation-dependent
        # Now that the output is rendered, we expect all options to have
        # been used.
        unused_options = set(self._options_do_not_access)
        unused_options -= self.options_used
        if unused_options:
            raise RuntimeError(
                'Unused options: {0} -- please check if you made a typo '
                'in any of them. Those that are truly not useful should '
                'be not be set so that this typo detection can be useful.'
                .format(unused_options)
            )
        return res

    def build(self, steps):
        if not steps:
            raise RuntimeError('Please ensure that the config you are passing '
                               'contains steps')
        return [self.setup(), self.diagnostics()] + steps

    def setup(self):
        'Your builder may want to install packages here.'
        raise NotImplementedError

    def diagnostics(self):
        'Log some system diagnostics before/after setup for ease of debugging'
        # The builder's repr is not used in a command to avoid pointlessly
        # invalidating Docker's build cache.
        return self.step('Diagnostics', [
            self.comment('Builder {0}'.format(repr(self))),
            self.run(ShellQuoted('hostname')),
            self.run(ShellQuoted('cat /etc/issue || echo no /etc/issue')),
            self.run(ShellQuoted('g++ --version || echo g++ not installed')),
            self.run(ShellQuoted('cmake --version || echo cmake not installed')),
        ])

    def step(self, name, actions):
        'A labeled collection of actions or other steps'
        raise NotImplementedError

    def run(self, shell_cmd):
        'Run this bash command'
        raise NotImplementedError

    def workdir(self, dir):
        'Create this directory if it does not exist, and change into it'
        raise NotImplementedError

    def copy_local_repo(self, dir, dest_name):
        '''
        Copy the local repo at `dir` into this step's `workdir()`, analog of:
          cp -r /path/to/folly folly
        '''
        raise NotImplementedError

    def debian_deps(self):
        return [
            'autoconf-archive',
            'bison',
            'build-essential',
            'cmake',
            'curl',
            'flex',
            'git',
            'gperf',
            'joe',
            'libboost-all-dev',
            'libcap-dev',
            'libdouble-conversion-dev',
            'libevent-dev',
            'libgflags-dev',
            'libgoogle-glog-dev',
            'libkrb5-dev',
            'libpcre3-dev',
            'libpthread-stubs0-dev',
            'libnuma-dev',
            'libsasl2-dev',
            'libsnappy-dev',
            'libsqlite3-dev',
            'libssl-dev',
            'libtool',
            'netcat-openbsd',
            'pkg-config',
            'sudo',
            'unzip',
            'wget',
        ]

    #
    # Specific build helpers
    #

    def install_debian_deps(self):
        actions = [
            self.run(
                ShellQuoted('apt-get update && apt-get install -yq {deps}').format(
                    deps=shell_join(' ', (
                        ShellQuoted(dep) for dep in self.debian_deps())))
            ),
        ]
        gcc_version = self.option('gcc_version')

        # Make the selected GCC the default before building anything
        actions.extend([
            self.run(ShellQuoted('apt-get install -yq {c} {cpp}').format(
                c=ShellQuoted('gcc-{v}').format(v=gcc_version),
                cpp=ShellQuoted('g++-{v}').format(v=gcc_version),
            )),
            self.run(ShellQuoted(
                'update-alternatives --install /usr/bin/gcc gcc {c} 40 '
                '--slave /usr/bin/g++ g++ {cpp}'
            ).format(
                c=ShellQuoted('/usr/bin/gcc-{v}').format(v=gcc_version),
                cpp=ShellQuoted('/usr/bin/g++-{v}').format(v=gcc_version),
            )),
            self.run(ShellQuoted('update-alternatives --config gcc')),
        ])

        actions.extend(self.debian_ccache_setup_steps())

        return self.step('Install packages for Debian-based OS', actions)

    def debian_ccache_setup_steps(self):
        return []  # It's ok to ship a renderer without ccache support.

    def github_project_workdir(self, project, path):
        # Only check out a non-default branch if requested. This especially
        # makes sense when building from a local repo.
        git_hash = self.option(
            '{0}:git_hash'.format(project),
            # Any repo that has a hash in deps/github_hashes defaults to
            # that, with the goal of making builds maximally consistent.
            self._github_hashes.get(project, '')
        )
        maybe_change_branch = [
            self.run(ShellQuoted('git checkout {hash}').format(hash=git_hash)),
        ] if git_hash else []

        base_dir = self.option('projects_dir')

        local_repo_dir = self.option('{0}:local_repo_dir'.format(project), '')
        return self.step('Check out {0}, workdir {1}'.format(project, path), [
            self.workdir(base_dir),
            self.run(
                ShellQuoted('git clone https://github.com/{p}').format(p=project)
            ) if not local_repo_dir else self.copy_local_repo(
                local_repo_dir, os.path.basename(project)
            ),
            self.workdir(path_join(base_dir, os.path.basename(project), path)),
        ] + maybe_change_branch)

    def fb_github_project_workdir(self, project_and_path, github_org='facebook'):
        'This helper lets Facebook-internal CI special-cases FB projects'
        project, path = project_and_path.split('/', 1)
        return self.github_project_workdir(github_org + '/' + project, path)

    def _make_vars(self, make_vars):
        return shell_join(' ', (
            ShellQuoted('{k}={v}').format(k=k, v=v)
                for k, v in ({} if make_vars is None else make_vars).items()
        ))

    def parallel_make(self, make_vars=None):
        return self.run(ShellQuoted('make -j {n} {vars}').format(
            n=self.option('make_parallelism'),
            vars=self._make_vars(make_vars),
        ))

    def make_and_install(self, make_vars=None):
        return [
            self.parallel_make(make_vars),
            self.run(ShellQuoted('make install {vars}').format(
                vars=self._make_vars(make_vars),
            )),
        ]

    def configure(self, name=None):
        autoconf_options = {}
        if name is not None:
            autoconf_options.update(
                self.option('{0}:autoconf_options'.format(name), {})
            )
        return [
            self.run(ShellQuoted(
                'LDFLAGS="$LDFLAGS -L"{p}"/lib -Wl,-rpath="{p}"/lib" '
                'CFLAGS="$CFLAGS -I"{p}"/include" '
                'CPPFLAGS="$CPPFLAGS -I"{p}"/include" '
                'PY_PREFIX={p} '
                './configure --prefix={p} {args}'
            ).format(
                p=self.option('prefix'),
                args=shell_join(' ', (
                    ShellQuoted('{k}={v}').format(k=k, v=v)
                    for k, v in autoconf_options.items()
                )),
            )),
        ]

    def autoconf_install(self, name):
        return self.step('Build and install {0}'.format(name), [
            self.run(ShellQuoted('autoreconf -ivf')),
        ] + self.configure() + self.make_and_install())

    def cmake_configure(self, name, cmake_path='..'):
        cmake_defines = {
            'BUILD_SHARED_LIBS': 'ON',
            'CMAKE_INSTALL_PREFIX': self.option('prefix'),
        }
        cmake_defines.update(
            self.option('{0}:cmake_defines'.format(name), {})
        )
        return [
            self.run(ShellQuoted(
                'CXXFLAGS="$CXXFLAGS -fPIC -isystem "{p}"/include" '
                'CFLAGS="$CFLAGS -fPIC -isystem "{p}"/include" '
                'cmake {args} {cmake_path}'
            ).format(
                p=self.option('prefix'),
                args=shell_join(' ', (
                    ShellQuoted('-D{k}={v}').format(k=k, v=v)
                        for k, v in cmake_defines.items()
                )),
                cmake_path=cmake_path,
            )),
        ]

    def cmake_install(self, name, cmake_path='..'):
        return self.step(
            'Build and install {0}'.format(name),
            self.cmake_configure(name, cmake_path) + self.make_and_install()
        )

    def fb_github_autoconf_install(self, project_and_path, github_org='facebook'):
        return [
            self.fb_github_project_workdir(project_and_path, github_org),
            self.autoconf_install(project_and_path),
        ]

    def fb_github_cmake_install(self, project_and_path, cmake_path='..', github_org='facebook'):
        return [
            self.fb_github_project_workdir(project_and_path, github_org),
            self.cmake_install(project_and_path, cmake_path),
        ]
