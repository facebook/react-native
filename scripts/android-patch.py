import os
import sys

# A Python script that can be used to determine which files that require
# patching have been touched between two points in the repo.

def shell(command):
    stream = os.popen(command)
    result = stream.read()
    stream.close()
    return result

def get_patches():
    patches = {}
    for file in shell('find android-patches/patches -type f').splitlines():
        slash_indices = [i for (i, c) in enumerate(file) if c == '/']
        if len(slash_indices) < 3:
            continue
        patch_name = file[slash_indices[1]+1:slash_indices[2]]
        filename = file[slash_indices[2]+1:]
        if patch_name not in patches:
            patches[patch_name] = []
        patches[patch_name].append(filename)
    return patches

def get_touched_files(branch_from, branch_to):
    files = []
    command = 'git diff --name-status {0} {1}'.format(branch_from, branch_to)
    for line in shell(command).splitlines():
        files.append(line.split('\t')[-1])
    return files

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.stderr.write('Usage: android-patch.py <commit> <commit>')
        sys.exit(1)
    patches = get_patches()
    touched_files = set(get_touched_files(sys.argv[1], sys.argv[2]))

    for patch_name in patches:
        patched_and_touched = [file for file in patches[patch_name] \
                               if file in touched_files]
        if len(patched_and_touched) > 0:
            print('\033[4m{0}\033[0m'.format(patch_name))
            for file in patched_and_touched:
                print('* {0}'.format(file))
