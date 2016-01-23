import contextlib
import os
import shutil
import sys
import tempfile
import zipfile

# Helper that unpacks the contents of the res folder of an .aar file
# into given destination.

@contextlib.contextmanager
def cleanup(path):
    yield path
    shutil.rmtree(path)

if __name__ == '__main__':
    with zipfile.ZipFile(sys.argv[1], 'r') as z:
        with cleanup(tempfile.mkdtemp()) as temp_path:
            z.extractall(temp_path, filter(lambda n: n.startswith('res/'), z.namelist()))
            shutil.move(os.path.join(temp_path, 'res'), sys.argv[2])
