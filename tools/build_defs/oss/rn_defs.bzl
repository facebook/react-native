# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Helpers for referring to React Native open source code.

This lets us build React Native:
 - At Facebook by running buck from the root of the fb repo
 - Outside of Facebook by running buck in the root of the git repo
"""
# @lint-ignore-every BUCKRESTRICTEDSYNTAX

_DEBUG_PREPROCESSOR_FLAGS = []

_APPLE_COMPILER_FLAGS = []

def get_debug_preprocessor_flags():
    return _DEBUG_PREPROCESSOR_FLAGS

def get_apple_compiler_flags():
    return _APPLE_COMPILER_FLAGS

IS_OSS_BUILD = True

GLOG_DEP = "//ReactAndroid/build/third-party-ndk/glog:glog"

INSPECTOR_FLAGS = []

APPLE_JSC_DEPS = []

ANDROID_JSC_INTERNAL_DEPS = [
    "//native/third-party/jsc:jsc",
    "//native/third-party/jsc:jsc_legacy_profiler",
]

ANDROID_JSC_DEPS = ANDROID_JSC_INTERNAL_DEPS

ANDROID = "Android"

APPLE = ""

YOGA_TARGET = "//ReactAndroid/src/main/java/com/facebook:yoga"

YOGA_CXX_TARGET = "//ReactCommon/yoga:yoga"

FBGLOGINIT_TARGET = "//ReactAndroid/src/main/jni/first-party/fbgloginit:fbgloginit"

FBJNI_TARGET = "//ReactAndroid/src/main/jni/first-party/fb:jni"

JNI_TARGET = "//ReactAndroid/src/main/jni/first-party/jni-hack:jni-hack"

KEYSTORE_TARGET = "//keystores:debug"

def get_apple_inspector_flags():
    return []

def get_android_inspector_flags():
    return []

# Building is not supported in OSS right now
def rn_xplat_cxx_library(name, **kwargs):
    new_kwargs = {
        k: v
        for k, v in kwargs.items()
        if k.startswith("exported_")
    }

    native.cxx_library(
        name = name,
        visibility = kwargs.get("visibility", []),
        **new_kwargs
    )

# Example: react_native_target('java/com/facebook/react/common:common')
def react_native_target(path):
    return "//ReactAndroid/src/main/" + path

# Example: react_native_xplat_target('bridge:bridge')
def react_native_xplat_target(path):
    return "//ReactCommon/" + path

def react_native_xplat_target_apple(path):
    return react_native_xplat_target(path) + "Apple"

# Example: react_native_tests_target('java/com/facebook/react/modules:modules')
def react_native_tests_target(path):
    return "//ReactAndroid/src/test/" + path

# Example: react_native_integration_tests_target('java/com/facebook/react/testing:testing')
def react_native_integration_tests_target(path):
    return "//ReactAndroid/src/androidTest/" + path

# Helpers for referring to non-RN code from RN OSS code.
# Example: react_native_dep('java/com/facebook/systrace:systrace')
def react_native_dep(path):
    return "//ReactAndroid/src/main/" + path

# Example: react_native_xplat_dep('java/com/facebook/systrace:systrace')
def react_native_xplat_dep(path):
    return "//ReactCommon/" + path

def rn_debug_flags():
    return []

def rn_feature_flags():
    return []

# React property preprocessor
def rn_android_library(name, deps = [], plugins = [], *args, **kwargs):
    if react_native_target(
        "java/com/facebook/react/uimanager/annotations:annotations",
    ) in deps and name != "processing":
        react_property_plugins = [
            react_native_target(
                "java/com/facebook/react/processing:processing",
            ),
        ]

        plugins = list(set(plugins + react_property_plugins))

    if react_native_target(
        "java/com/facebook/react/module/annotations:annotations",
    ) in deps and name != "processing":
        react_module_plugins = [
            react_native_target(
                "java/com/facebook/react/module/processing:processing",
            ),
        ]

        plugins = list(set(plugins + react_module_plugins))

    is_androidx = kwargs.pop("is_androidx", False)
    provided_deps = kwargs.pop("provided_deps", [])
    appcompat = react_native_dep("third-party/android/support/v7/appcompat-orig:appcompat")
    support_v4 = react_native_dep("third-party/android/support/v4:lib-support-v4")

    if is_androidx and (appcompat in deps or appcompat in provided_deps):
        # add androidx target to provided_deps
        pass
        # provided_deps.append(
        #     react_native_dep(
        #         ""
        #     )
        # )

    if is_androidx and (support_v4 in deps or support_v4 in provided_deps):
        # add androidx target to provided_deps
        pass
        # provided_deps.append(
        #     react_native_dep(
        #         ""
        #     )
        # )

    native.android_library(name = name, deps = deps, plugins = plugins, provided_deps = provided_deps, *args, **kwargs)

def rn_android_binary(*args, **kwargs):
    native.android_binary(*args, **kwargs)

def rn_android_build_config(*args, **kwargs):
    native.android_build_config(*args, **kwargs)

def rn_android_resource(*args, **kwargs):
    native.android_resource(*args, **kwargs)

def rn_android_prebuilt_aar(*args, **kwargs):
    native.android_prebuilt_aar(*args, **kwargs)

def rn_apple_library(*args, **kwargs):
    kwargs.setdefault("link_whole", True)
    kwargs.setdefault("enable_exceptions", True)
    native.apple_library(*args, **kwargs)

def rn_plugin_apple_library(**kwargs):
    kwargs.setdefault("link_whole", True)

    # This just an alias to apple_library for now.
    native.apple_library(**kwargs)

def rn_java_library(*args, **kwargs):
    native.java_library(*args, **kwargs)

def rn_java_annotation_processor(*args, **kwargs):
    native.java_annotation_processor(*args, **kwargs)

def rn_prebuilt_native_library(*args, **kwargs):
    native.prebuilt_native_library(*args, **kwargs)

def rn_prebuilt_jar(*args, **kwargs):
    native.prebuilt_jar(*args, **kwargs)

def rn_genrule(*args, **kwargs):
    native.genrule(*args, **kwargs)

def rn_robolectric_test(name, srcs, vm_args = None, *args, **kwargs):
    vm_args = vm_args or []

    is_androidx = kwargs.pop("is_androidx", False)

    extra_vm_args = [
        "-XX:+UseConcMarkSweepGC",  # required by -XX:+CMSClassUnloadingEnabled
        "-XX:+CMSClassUnloadingEnabled",
        "-XX:ReservedCodeCacheSize=150M",
        "-Drobolectric.dependency.dir=buck-out/gen/ReactAndroid/src/main/third-party/java/robolectric3/robolectric",
        "-Dlibraries=buck-out/gen/ReactAndroid/src/main/third-party/java/robolectric3/robolectric/*.jar",
        "-Drobolectric.logging.enabled=true",
        "-XX:MaxPermSize=620m",
        "-Drobolectric.offline=true",
    ]
    if native.read_config("user", "use_dev_shm"):
        extra_vm_args.append("-Djava.io.tmpdir=/dev/shm")

    # RN tests use  Powermock, which means they get their own ClassLoaders.
    # Because the yoga native library (or any native library) can only be loaded into one
    # ClassLoader at a time, we need to run each in its own process, hence fork_mode = 'per_test'.
    native.robolectric_test(
        name = name,
        use_cxx_libraries = True,
        cxx_library_whitelist = [
            "//ReactCommon/yoga:yoga",
            "//ReactAndroid/src/main/jni/first-party/yogajni:jni",
        ],
        fork_mode = "per_test",
        srcs = srcs,
        vm_args = vm_args + extra_vm_args,
        *args,
        **kwargs
    )

def cxx_library(allow_jni_merging = None, **kwargs):
    _ignore = allow_jni_merging
    args = {
        k: v
        for k, v in kwargs.items()
        if not (k.startswith("fbandroid_") or k.startswith("fbobjc_"))
    }
    native.cxx_library(**args)

def _paths_join(path, *others):
    """Joins one or more path components."""
    result = path

    for p in others:
        if p.startswith("/"):  # absolute
            result = p
        elif not result or result.endswith("/"):
            result += p
        else:
            result += "/" + p

    return result

def subdir_glob(glob_specs, exclude = None, prefix = ""):
    """Returns a dict of sub-directory relative paths to full paths.

    The subdir_glob() function is useful for defining header maps for C/C++
    libraries which should be relative the given sub-directory.
    Given a list of tuples, the form of (relative-sub-directory, glob-pattern),
    it returns a dict of sub-directory relative paths to full paths.

    Please refer to native.glob() for explanations and examples of the pattern.

    Args:
      glob_specs: The array of tuples in form of
        (relative-sub-directory, glob-pattern inside relative-sub-directory).
        type: List[Tuple[str, str]]
      exclude: A list of patterns to identify files that should be removed
        from the set specified by the first argument. Defaults to [].
        type: Optional[List[str]]
      prefix: If is not None, prepends it to each key in the dictionary.
        Defaults to None.
        type: Optional[str]

    Returns:
      A dict of sub-directory relative paths to full paths.
    """
    if exclude == None:
        exclude = []

    results = []

    for dirpath, glob_pattern in glob_specs:
        results.append(
            _single_subdir_glob(dirpath, glob_pattern, exclude, prefix),
        )

    return _merge_maps(*results)

def _merge_maps(*file_maps):
    result = {}
    for file_map in file_maps:
        for key in file_map:
            if key in result and result[key] != file_map[key]:
                fail(
                    "Conflicting files in file search paths. " +
                    "\"%s\" maps to both \"%s\" and \"%s\"." %
                    (key, result[key], file_map[key]),
                )

            result[key] = file_map[key]

    return result

def _single_subdir_glob(dirpath, glob_pattern, exclude = None, prefix = None):
    if exclude == None:
        exclude = []
    results = {}
    files = native.glob([_paths_join(dirpath, glob_pattern)], exclude = exclude)
    for f in files:
        if dirpath:
            key = f[len(dirpath) + 1:]
        else:
            key = f
        if prefix:
            key = _paths_join(prefix, key)
        results[key] = f

    return results

def fb_apple_library(*args, **kwargs):
    native.apple_library(*args, **kwargs)

def oss_cxx_library(**kwargs):
    cxx_library(**kwargs)

def jni_instrumentation_test_lib(**_kwargs):
    """A noop stub for OSS build."""
    pass

def fb_xplat_cxx_test(**_kwargs):
    """A noop stub for OSS build."""
    pass

# iOS Plugin support.
def react_module_plugin_providers():
    # Noop for now
    return []
