# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Special globbing for js libraries, including and excluding certain files"""

js_glob_exts = (
    "gif",
    "html",
    "jpeg",
    "jpg",
    "js",
    "js.flow",
    "json",
    "mp4",
    "png",
)

def js_glob(dirs, excludes = [], force_include_bundles = False):
    globs = []
    for glob_dir in dirs:
        if glob_dir == ".":
            globs.extend(["*.%s" % (ext) for ext in js_glob_exts])
        elif glob_dir == "**/*":
            globs.extend(["**/*.%s" % (ext) for ext in js_glob_exts])
        else:
            globs.extend(
                ["%s/**/*.%s" % (glob_dir, ext) for ext in js_glob_exts],
            )
    return native.glob(
        globs,
        exclude = [
            "**/__tests__/**",
            "**/__mocks__/**",
            "**/__MOCKS__/**",
            "**/__flowtests__/**",
            "**/*.xcodeproj/**",
        ] + (excludes or []),
    )
