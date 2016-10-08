from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
import os
import sys
import zipfile

srcs = sys.argv[1:]

with zipfile.ZipFile(sys.stdout, 'w') as jar:
    for src in srcs:
        archive_name = os.path.join('assets/', os.path.basename(src))
        jar.write(src, archive_name, zipfile.ZIP_DEFLATED)
