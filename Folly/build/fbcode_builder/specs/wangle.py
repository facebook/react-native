#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import specs.folly as folly
import specs.fizz as fizz
import specs.sodium as sodium


def fbcode_builder_spec(builder):
    # Projects that simply depend on Wangle need not spend time on tests.
    builder.add_option('wangle/wangle/build:cmake_defines', {'BUILD_TESTS': 'OFF'})
    return {
        'depends_on': [folly, fizz, sodium],
        'steps': [
            builder.fb_github_cmake_install('wangle/wangle/build'),
        ],
    }
