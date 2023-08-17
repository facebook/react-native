import re

with open('714b502.diff') as file:
    lines = file.readlines()

renames = []
non_renames = []

for i, line in enumerate(lines):
    matches = re.match('^diff --git a/(.*) b/(.*)$', line)
    if not matches:
        continue
    percent_match = re.match('similarity index (.*)%', lines[i + 1])
    if percent_match:
        renames.append((matches.group(1), matches.group(2), percent_match.group(1)))
        print('\t'.join(renames[-1]))
    else:
        non_renames.append((matches.group(1), matches.group(2), '0'))
        print('\t'.join(non_renames[-1]))
