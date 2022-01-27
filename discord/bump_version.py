#!/usr/bin/env python3

from pathlib import Path
from typing import List
import re
import subprocess
import sys


def check_output(args: List[str]) -> str:
    return subprocess.check_output(args).decode('utf-8').strip()


VERSION_MATCHER = re.compile(r'^(.*)-discord-(\d*)$')

status = check_output(['git', 'status', '--porcelain'])
if status != '':
    print('Detected changed files, please remove or commit them first.\n')
    print(status)
    sys.exit(1)


root = check_output(['git', 'rev-parse', '--show-toplevel'])
android_path = Path(root) / "ReactAndroid"
props_path = android_path / "gradle.properties"

version = None
property_lines = [line.strip() for line in props_path.read_text().splitlines()]
for line in property_lines:
    if line.startswith("VERSION_NAME="):
        version = line.split('=')[1]

assert version, "unable to find current version"

matches = VERSION_MATCHER.match(version)
assert matches, f'{version} did not match expected format, X.Y.Z-discord-N'

upstream = matches[1]
local = int(matches[2])

new_version = f'{upstream}-discord-{local + 1}'

with open(props_path, 'w') as f:
    for line in property_lines:
        if line.startswith("VERSION_NAME="):
            f.write(f'VERSION_NAME={new_version}\n')
        else:
            f.write(f'{line}\n')


branch_name = check_output(['git', 'symbolic-ref', '--short', 'HEAD'])

subprocess.check_call(
    ['../gradlew', 'publishReleasePublicationToDiscordRepository'],
    cwd=android_path.absolute()
  )

subprocess.check_call(['git', 'add', props_path.absolute()])
subprocess.check_call(['git', 'commit', '-m', f'version bump: {new_version}'])
subprocess.check_call(['git', 'push', 'origin', branch_name])

new_commit = check_output(['git', 'rev-parse', 'HEAD'])


print(f'NEW TAGGED VERSION: {new_version}')
print(f'NEW COMMIT: {new_commit}')
