#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import specs.folly as folly
import specs.sodium as sodium


def fbcode_builder_spec(builder):
    return {
        'depends_on': [folly, sodium],
        'steps': [
            builder.fb_github_cmake_install(
                'fizz/fizz/build',
                github_org='facebookincubator',
            ),
        ],
    }
