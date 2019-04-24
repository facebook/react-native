#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals


def fbcode_builder_spec(builder):
    builder.add_option('google/googletest:git_hash', 'release-1.8.1')
    builder.add_option(
        'google/googletest:cmake_defines',
        {'BUILD_GTEST': 'ON'}
    )
    return {
        'steps': [
            builder.github_project_workdir('google/googletest', 'build'),
            builder.cmake_install('google/googletest'),
        ],
    }
