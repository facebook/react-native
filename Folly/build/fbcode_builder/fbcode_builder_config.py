#!/usr/bin/env python
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
'Demo config, so that `make_docker_context.py --help` works in this directory.'

config = {
    'fbcode_builder_spec': lambda _builder: {
        'depends_on': [],
        'steps': [],
    },
    'github_project': 'demo/project',
}
