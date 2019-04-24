#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals


def fbcode_builder_spec(builder):
    return {
        'steps': [
            builder.fb_github_cmake_install('folly/folly'),
        ],
    }
