# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Helpers for referring to React Native open source code.

This lets us build React Native:
 - At Facebook by running buck from the root of the fb repo
 - Outside of Facebook by running buck in the root of the git repo
"""
# @lint-ignore-every BUCKRESTRICTEDSYNTAX

load(
    "//tools/build_defs:js_library_glob.bzl",
    _js_library_glob = "js_library_glob",
)

_DEBUG_PREPROCESSOR_FLAGS = []

_APPLE_COMPILER_FLAGS = []

def get_apple_compiler_flags():
    return _APPLE_COMPILER_FLAGS

def get_preprocessor_flags_for_build_mode():
    return _DEBUG_PREPROCESSOR_FLAGS

def get_static_library_ios_flags():
    return _APPLE_COMPILER_FLAGS

def get_objc_arc_preprocessor_flags():
    return [
        "-fobjc-arc",
        "-fno-objc-arc-exceptions",
        "-Qunused-arguments",
    ]

def get_hermes_shared_library_preprocessor_flags():
    return []

IS_OSS_BUILD = True

GLOG_DEP = "//ReactAndroid/build/third-party-ndk/glog:glog"

INSPECTOR_FLAGS = []

# Platform Definitions
CXX = "Default"

ANDROID = "Android"

APPLE = "Apple"

WINDOWS = "Windows"

# Apple SDK Definitions
IOS = "ios"

MACOSX = "macosx"

APPLETVOS = "appletvos"

YOGA_TARGET = "//ReactAndroid/src/main/java/com/facebook:yoga"

YOGA_CXX_TARGET = "//ReactCommon/yoga:yoga"

FBGLOGINIT_TARGET = "//ReactAndroid/src/main/jni/first-party/fbgloginit:fbgloginit"

FBJNI_TARGET = "//ReactAndroid/src/main/jni/first-party/fb:jni"

JNI_TARGET = "//ReactAndroid/src/main/jni/first-party/jni-hack:jni-hack"

KEYSTORE_TARGET = "//keystores:debug"

# Minimum supported iOS version for RN
REACT_NATIVE_TARGET_IOS_SDK = "12.4"

def get_apple_inspector_flags():
    return []

def get_android_inspector_flags():
    return []

def get_react_native_preprocessor_flags():
    # TODO: use this to define the compiler flag REACT_NATIVE_DEBUG in debug/dev mode builds only.
    # This is a replacement for NDEBUG since NDEBUG is always defined in Buck on all Android builds.
    return []

def get_react_native_ios_target_sdk_version():
    return REACT_NATIVE_TARGET_IOS_SDK

# Building is not supported in OSS right now
def rn_xplat_cxx_library(
        name,
        compiler_flags_enable_exceptions = False,
        compiler_flags_enable_rtti = False,
        compiler_flags_pedantic = False,
        **kwargs):
    visibility = kwargs.get("visibility", [])
    kwargs = {
        k: v
        for k, v in kwargs.items()
        if k.startswith("exported_")
    }

    # RTTI and exceptions must either be both on, or both off
    if compiler_flags_enable_exceptions != compiler_flags_enable_rtti:
        fail("Must enable or disable both exceptions and RTTI; they cannot be mismatched. See this post for details: https://fb.workplace.com/groups/iosappsize/permalink/2277094415672494/")

    # These are the default compiler flags for ALL React Native Cxx targets.
    # For all of these, we PREPEND to compiler_flags: if these are already set
    # or being overridden in compiler_flags, it's very likely that the flag is set
    # app-wide or that we're otherwise in some special mode.
    # OSS builds cannot have platform-specific flags here, so these are the same
    # for all platforms.
    kwargs["compiler_flags"] = kwargs.get("compiler_flags", [])

    kwargs["compiler_flags"] = ["-std=c++17"] + kwargs["compiler_flags"]
    kwargs["compiler_flags"] = ["-Wall"] + kwargs["compiler_flags"]
    kwargs["compiler_flags"] = ["-Werror"] + kwargs["compiler_flags"]

    # -Wpedantic catches usage of nonstandard language extensions that may not
    # be supported by other compilers (e.g. MSVC)
    if compiler_flags_pedantic:
        kwargs["compiler_flags"] = ["-Wpedantic"] + kwargs["compiler_flags"]
    else:
        kwargs["compiler_flags"] = ["-Wno-pedantic"] + kwargs["compiler_flags"]

    # For now, we allow turning off RTTI and exceptions for android builds only
    if compiler_flags_enable_exceptions:
        kwargs["compiler_flags"] = ["-fexceptions"] + kwargs["compiler_flags"]
    else:
        # TODO: fbjni currently DOES NOT WORK with -fno-exceptions, which breaks MOST RN Android modules
        kwargs["compiler_flags"] = ["-fexceptions"] + kwargs["compiler_flags"]
        kwargs["compiler_flags"] = ["-fno-exceptions"] + kwargs["compiler_flags"]

    if compiler_flags_enable_rtti:
        kwargs["compiler_flags"] = ["-frtti"] + kwargs["compiler_flags"]
    else:
        kwargs["compiler_flags"] = ["-fno-rtti"] + kwargs["compiler_flags"]

    native.cxx_library(
        name = name,
        visibility = visibility,
        **kwargs
    )

rn_xplat_cxx_library2 = rn_xplat_cxx_library

# Example: react_native_target('java/com/facebook/react/common:common')
def react_native_target(path):
    return "//ReactAndroid/src/main/" + path

# Example: react_native_xplat_target('bridge:bridge')
def react_native_xplat_target(path):
    return "//ReactCommon/" + path

def react_native_xplat_target_apple(path):
    return react_native_xplat_target(path) + "Apple"

def react_native_root_target(path):
    return "//" + path

def react_native_xplat_shared_library_target(path):
    return react_native_xplat_target(path)

def react_native_desktop_root_target(path):
    return "//" + path

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

def react_native_android_toplevel_dep(path):
    return react_native_dep(path)

# Example: react_native_xplat_dep('java/com/facebook/systrace:systrace')
def react_native_xplat_dep(path):
    return "//ReactCommon/" + path

def rn_extra_build_flags():
    return []

def _unique(li):
    return list({x: () for x in li})

# React property preprocessor
def rn_android_library(name, deps = [], plugins = [], *args, **kwargs):
    _ = kwargs.pop("autoglob", False)
    _ = kwargs.pop("pure_kotlin", False)
    if react_native_target(
        "java/com/facebook/react/uimanager/annotations:annotations",
    ) in deps and name != "processing":
        react_property_plugins = [
            react_native_target(
                "java/com/facebook/react/processing:processing",
            ),
        ]

        plugins = _unique(plugins + react_property_plugins)

    if react_native_target(
        "java/com/facebook/react/module/annotations:annotations",
    ) in deps and name != "processing":
        react_module_plugins = [
            react_native_target(
                "java/com/facebook/react/module/processing:processing",
            ),
        ]

        plugins = _unique(plugins + react_module_plugins)

    native.android_library(name = name, deps = deps, plugins = plugins, *args, **kwargs)

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
    kwargs.setdefault("target_sdk_version", get_react_native_ios_target_sdk_version())

    fb_apple_library(*args, **kwargs)

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

    _ = kwargs.pop("autoglob", False)

    kwargs["deps"] = kwargs.pop("deps", []) + [
        react_native_android_toplevel_dep("third-party/java/mockito2:mockito2"),
        react_native_dep("third-party/java/robolectric:robolectric"),
        react_native_tests_target("resources:robolectric"),
        react_native_xplat_dep("libraries/fbcore/src/test/java/com/facebook/powermock:powermock2"),
    ]

    extra_vm_args = [
        "-XX:+UseConcMarkSweepGC",  # required by -XX:+CMSClassUnloadingEnabled
        "-XX:+CMSClassUnloadingEnabled",
        "-XX:ReservedCodeCacheSize=150M",
        "-Drobolectric.dependency.dir=buck-out/gen/ReactAndroid/src/main/third-party/java/robolectric",
        "-Dlibraries=buck-out/gen/ReactAndroid/src/main/third-party/java/robolectric/*.jar",
        "-Drobolectric.logging.enabled=true",
        "-XX:MaxPermSize=620m",
        "-Drobolectric.offline=true",
        "-Drobolectric.looperMode=LEGACY",
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

def cxx_library(**kwargs):
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

js_library_glob = _js_library_glob

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
    # Unsupported kwargs
    _ = kwargs.pop("autoglob", False)
    _ = kwargs.pop("plugins_only", False)
    _ = kwargs.pop("enable_exceptions", False)
    _ = kwargs.pop("extension_api_only", False)
    _ = kwargs.pop("sdks", [])
    _ = kwargs.pop("inherited_buck_flags", [])
    _ = kwargs.pop("plugins", [])
    _ = kwargs.pop("complete_nullability", False)
    _ = kwargs.pop("plugins_header", "")

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
def react_module_plugin_providers(*args, **kwargs):
    # Noop for now
    return []

def react_fabric_component_plugin_provider(name, native_class_func):
    return None

HERMES_BYTECODE_VERSION = -1

RCT_IMAGE_DATA_DECODER_SOCKET = None
RCT_IMAGE_URL_LOADER_SOCKET = None
RCT_URL_REQUEST_HANDLER_SOCKET = None

def make_resource_glob(path):
    return native.glob([path + "/**/*." + x for x in [
        "m4a",
        "mp3",
        "otf",
        "png",
        "ttf",
        "caf",
    ]])
