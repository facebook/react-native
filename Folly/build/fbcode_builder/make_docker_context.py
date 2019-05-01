#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
'''
Reads `fbcode_builder_config.py` from the current directory, and prepares a
Docker context directory to build this project.  Prints to stdout the path
to the context directory.

Try `.../make_docker_context.py --help` from a project's `build/` directory.

By default, the Docker context directory will be in /tmp. It will always
contain a Dockerfile, and might also contain copies of your local repos, and
other data needed for the build container.
'''

import os
import tempfile
import textwrap

from docker_builder import DockerFBCodeBuilder
from parse_args import parse_args_to_fbcode_builder_opts


def make_docker_context(
    get_steps_fn, github_project, opts=None, default_context_dir=None
):
    '''
    Returns a path to the Docker context directory. See parse_args.py.

    Helper for making a command-line utility that writes your project's
    Dockerfile and associated data into a (temporary) directory.  Your main
    program might look something like this:

        print(make_docker_context(
            lambda builder: [builder.step(...), ...],
            'facebook/your_project',
        ))
    '''

    if opts is None:
        opts = {}

    valid_versions = (
        ('ubuntu:16.04', '5'),
    )

    def add_args(parser):
        parser.add_argument(
            '--docker-context-dir', metavar='DIR',
            default=default_context_dir,
            help='Write the Dockerfile and its context into this directory. '
                'If empty, make a temporary directory. Default: %(default)s.',
        )
        parser.add_argument(
            '--user', metavar='NAME', default=opts.get('user', 'nobody'),
            help='Build and install as this user. Default: %(default)s.',
        )
        parser.add_argument(
            '--prefix', metavar='DIR',
            default=opts.get('prefix', '/home/install'),
            help='Install all libraries in this prefix. Default: %(default)s.',
        )
        parser.add_argument(
            '--projects-dir', metavar='DIR',
            default=opts.get('projects_dir', '/home'),
            help='Place project code directories here. Default: %(default)s.',
        )
        parser.add_argument(
            '--os-image', metavar='IMG', choices=zip(*valid_versions)[0],
            default=opts.get('os_image', valid_versions[0][0]),
            help='Docker OS image -- be sure to use only ones you trust (See '
                'README.docker). Choices: %(choices)s. Default: %(default)s.',
        )
        parser.add_argument(
            '--gcc-version', metavar='VER',
            choices=set(zip(*valid_versions)[1]),
            default=opts.get('gcc_version', valid_versions[0][1]),
            help='Choices: %(choices)s. Default: %(default)s.',
        )
        parser.add_argument(
            '--make-parallelism', metavar='NUM', type=int,
            default=opts.get('make_parallelism', 1),
            help='Use `make -j` on multi-CPU systems with lots of RAM. '
                'Default: %(default)s.',
        )
        parser.add_argument(
            '--local-repo-dir', metavar='DIR',
            help='If set, build {0} from a local directory instead of Github.'
                .format(github_project),
        )
        parser.add_argument(
            '--ccache-tgz', metavar='PATH',
            help='If set, enable ccache for the build. To initialize the '
                 'cache, first try to hardlink, then to copy --cache-tgz '
                 'as ccache.tgz into the --docker-context-dir.'
        )

    opts = parse_args_to_fbcode_builder_opts(
        add_args,
        # These have add_argument() calls, others are set via --option.
        (
            'docker_context_dir',
            'user',
            'prefix',
            'projects_dir',
            'os_image',
            'gcc_version',
            'make_parallelism',
            'local_repo_dir',
            'ccache_tgz',
        ),
        opts,
        help=textwrap.dedent('''

        Reads `fbcode_builder_config.py` from the current directory, and
        prepares a Docker context directory to build {github_project} and
        its dependencies.  Prints to stdout the path to the context
        directory.

        Pass --option {github_project}:git_hash SHA1 to build something
        other than the master branch from Github.

        Or, pass --option {github_project}:local_repo_dir LOCAL_PATH to
        build from a local repo instead of cloning from Github.

        Usage:
            (cd $(./make_docker_context.py) && docker build . 2>&1 | tee log)

        '''.format(github_project=github_project)),
    )

    # This allows travis_docker_build.sh not to know the main Github project.
    local_repo_dir = opts.pop('local_repo_dir', None)
    if local_repo_dir is not None:
        opts['{0}:local_repo_dir'.format(github_project)] = local_repo_dir

    if (opts.get('os_image'), opts.get('gcc_version')) not in valid_versions:
        raise Exception(
            'Due to 4/5 ABI changes (std::string), we can only use {0}'.format(
                ' / '.join('GCC {1} on {0}'.format(*p) for p in valid_versions)
            )
        )

    if opts.get('docker_context_dir') is None:
        opts['docker_context_dir'] = tempfile.mkdtemp(prefix='docker-context-')
    elif not os.path.exists(opts.get('docker_context_dir')):
        os.makedirs(opts.get('docker_context_dir'))

    builder = DockerFBCodeBuilder(**opts)
    context_dir = builder.option('docker_context_dir')  # Mark option "in-use"
    # The renderer may also populate some files into the context_dir.
    dockerfile = builder.render(get_steps_fn(builder))

    with os.fdopen(os.open(
        os.path.join(context_dir, 'Dockerfile'),
        os.O_RDWR | os.O_CREAT | os.O_EXCL,  # Do not overwrite existing files
        0o644,
    ), 'w') as f:
        f.write(dockerfile)

    return context_dir


if __name__ == '__main__':
    from utils import read_fbcode_builder_config, build_fbcode_builder_config

    # Load a spec from the current directory
    config = read_fbcode_builder_config('fbcode_builder_config.py')
    print(make_docker_context(
        build_fbcode_builder_config(config),
        config['github_project'],
    ))
