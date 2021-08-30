import os

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
    for line in shell('git diff --name-status {0} {1}'.format(branch_from, branch_to)).splitlines():
        files.append(line.split('\t')[-1])
    return files

patches = get_patches()
patched_files = set.union(*[set(value) for value in patches.values()])
touched_files = get_touched_files('amgleitman/0.64-merge-2020-07-17', 'master')

patched_and_touched = [f for f in touched_files if f in patched_files]

# ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManager.java
# ReactAndroid/src/main/java/com/facebook/react/ReactInstanceManagerBuilder.java
# ReactAndroid/src/main/java/com/facebook/react/bridge/CatalystInstanceImpl.java
# ReactAndroid/src/main/jni/react/jni/Android.mk