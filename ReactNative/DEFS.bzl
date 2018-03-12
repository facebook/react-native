"""Helpers for referring to React Native open source code.

This lets us build React Native:
 - At Facebook by running buck from the root of the fb repo
 - Outside of Facebook by running buck in the root of the git repo
"""
# @lint-ignore-every SKYLINT

IS_OSS_BUILD = True

GLOG_DEP = "//ReactAndroid/build/third-party-ndk/glog:glog"

INSPECTOR_FLAGS = []
DEBUG_PREPROCESSOR_FLAGS = []

APPLE_JSC_INTERNAL_DEPS = []
APPLE_JSC_DEPS = []

ANDROID_JSC_INTERNAL_DEPS = [
    '//native/third-party/jsc:jsc',
    '//native/third-party/jsc:jsc_legacy_profiler',
]
ANDROID_JSC_DEPS = ANDROID_JSC_INTERNAL_DEPS
ANDROID = "Android"

YOGA_TARGET = '//ReactAndroid/src/main/java/com/facebook:yoga'
FBGLOGINIT_TARGET = '//ReactAndroid/src/main/jni/first-party/fbgloginit:fbgloginit'
FBJNI_TARGET = '//ReactAndroid/src/main/jni/first-party/fb:jni'
JNI_TARGET = '//ReactAndroid/src/main/jni/first-party/jni-hack:jni-hack'
KEYSTORE_TARGET = '//keystores:debug'

with allow_unsafe_import():
    import os


# Building is not supported in OSS right now
def rn_xplat_cxx_library(name, platforms = None, **kwargs):
    cxx_library(name=name, **kwargs)


# Example: react_native_target('java/com/facebook/react/common:common')
def react_native_target(path):
    return '//ReactAndroid/src/main/' + path


# Example: react_native_xplat_target('bridge:bridge')
def react_native_xplat_target(path):
    return '//ReactCommon/' + path


# Example: react_native_tests_target('java/com/facebook/react/modules:modules')
def react_native_tests_target(path):
    return '//ReactAndroid/src/test/' + path


# Example: react_native_integration_tests_target('java/com/facebook/react/testing:testing')
def react_native_integration_tests_target(path):
    return '//ReactAndroid/src/androidTest/' + path


# Helper for referring to non-RN code from RN OSS code.
# Example: react_native_dep('java/com/facebook/systrace:systrace')
def react_native_dep(path):
    return '//ReactAndroid/src/main/' + path


# React property preprocessor
def rn_android_library(name, deps=[], plugins=[], *args, **kwargs):

    if react_native_target(
        'java/com/facebook/react/uimanager/annotations:annotations'
    ) in deps and name != 'processing':
        react_property_plugins = [
            react_native_target(
                'java/com/facebook/react/processing:processing'
            ),
        ]

        plugins = list(set(plugins + react_property_plugins))

    if react_native_target(
        'java/com/facebook/react/module/annotations:annotations'
    ) in deps and name != 'processing':
        react_module_plugins = [
            react_native_target(
                'java/com/facebook/react/module/processing:processing'
            ),
        ]

        plugins = list(set(plugins + react_module_plugins))

    android_library(name=name, deps=deps, plugins=plugins, *args, **kwargs)


def rn_android_binary(*args, **kwargs):
    android_binary(*args, **kwargs)


def rn_android_build_config(*args, **kwargs):
    android_build_config(*args, **kwargs)


def rn_android_resource(*args, **kwargs):
    android_resource(*args, **kwargs)


def rn_android_prebuilt_aar(*args, **kwargs):
    android_prebuilt_aar(*args, **kwargs)


def rn_java_library(*args, **kwargs):
    java_library(*args, **kwargs)


def rn_java_annotation_processor(*args, **kwargs):
    java_annotation_processor(*args, **kwargs)


def rn_prebuilt_native_library(*args, **kwargs):
    prebuilt_native_library(*args, **kwargs)


def rn_prebuilt_jar(*args, **kwargs):
    prebuilt_jar(*args, **kwargs)


def rn_robolectric_test(name, srcs, vm_args=None, *args, **kwargs):
    vm_args = vm_args or []

    # We may need to create buck-out/gen/ if we're running after buck clean.
    tmp = 'buck-out/gen/' + get_base_path(
    ) + '/__java_test_' + name + '_output__'
    extra_vm_args = [
        '-XX:+UseConcMarkSweepGC',  # required by -XX:+CMSClassUnloadingEnabled
        '-XX:+CMSClassUnloadingEnabled',
        '-XX:ReservedCodeCacheSize=150M',
        '-Drobolectric.dependency.dir=buck-out/gen/ReactAndroid/src/main/third-party/java/robolectric3/robolectric',
        '-Dlibraries=buck-out/gen/ReactAndroid/src/main/third-party/java/robolectric3/robolectric/*.jar',
        '-Drobolectric.logging.enabled=true',
        '-XX:MaxPermSize=620m',
        '-Drobolectric.offline=true',
    ]
    if os.path.isdir("/dev/shm") and 'CIRCLECI' not in os.environ:
        extra_vm_args.append('-Djava.io.tmpdir=/dev/shm')
    else:
        extra_vm_args.append(
            '-Djava.io.tmpdir=%s' %
            os.path.join(os.path.abspath('.'), 'buck-out/bin')
        )

    # RN tests use  Powermock, which means they get their own ClassLoaders.
    # Because the yoga native library (or any native library) can only be loaded into one
    # ClassLoader at a time, we need to run each in its own process, hence fork_mode = 'per_test'.
    native.robolectric_test(
        name=name,
        use_cxx_libraries=True,
        cxx_library_whitelist=[
            '//ReactCommon/yoga:yoga',
            '//ReactAndroid/src/main/jni/first-party/yogajni:jni',
        ],
        fork_mode='per_test',
        srcs=srcs,
        vm_args=vm_args + extra_vm_args,
        *args,
        **kwargs
    )


original_cxx_library = cxx_library


def cxx_library(allow_jni_merging=None, **kwargs):
    kwargs.pop('fbandroid_deps', [])
    kwargs.pop('fbobjc_deps', [])
    original_cxx_library(**kwargs)
