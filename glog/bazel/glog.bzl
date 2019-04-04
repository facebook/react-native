# Implement a macro glog_library() that the BUILD file can load.

# By default, glog is built with gflags support.  You can change this behavior
# by using glog_library(with_gflags=0)
#
# This file is inspired by the following sample BUILD files:
#       https://github.com/google/glog/issues/61
#       https://github.com/google/glog/files/393474/BUILD.txt

def glog_library(namespace='google', with_gflags=1):
    if native.repository_name() != '@':
        gendir = '$(GENDIR)/external/' + native.repository_name().lstrip('@')
    else:
        gendir = '$(GENDIR)'

    native.cc_library(
        name = 'glog',
        visibility = [ '//visibility:public' ],
        srcs = [
            ':config_h',
            'src/base/commandlineflags.h',
            'src/base/googleinit.h',
            'src/base/mutex.h',
            'src/demangle.cc',
            'src/demangle.h',
            'src/logging.cc',
            'src/raw_logging.cc',
            'src/signalhandler.cc',
            'src/stacktrace.h',
            'src/stacktrace_generic-inl.h',
            'src/stacktrace_libunwind-inl.h',
            'src/stacktrace_powerpc-inl.h',
            'src/stacktrace_windows-inl.h',
            'src/stacktrace_x86-inl.h',
            'src/stacktrace_x86_64-inl.h',
            'src/symbolize.cc',
            'src/symbolize.h',
            'src/utilities.cc',
            'src/utilities.h',
            'src/vlog_is_on.cc',
        ],
        hdrs = [
            ':logging_h',
            ':raw_logging_h',
            ':stl_logging_h',
            ':vlog_is_on_h',
            'src/glog/log_severity.h',
        ],
        strip_include_prefix = 'src',
        copts = [
            # Disable warnings that exists in glog.
            '-Wno-sign-compare',
            '-Wno-unused-function',
            '-Wno-unused-local-typedefs',
            '-Wno-unused-variable',
            # Inject a C++ namespace.
            "-D_START_GOOGLE_NAMESPACE_='namespace %s {'" % namespace,
            "-D_END_GOOGLE_NAMESPACE_='}'",
            "-DGOOGLE_NAMESPACE='%s'" % namespace,
            # Allows src/base/mutex.h to include pthread.h.
            '-DHAVE_PTHREAD',
            # Allows src/logging.cc to determine the host name.
            '-DHAVE_SYS_UTSNAME_H',
            # For src/utilities.cc.
            '-DHAVE_SYS_SYSCALL_H',
            '-DHAVE_SYS_TIME_H',
            '-DHAVE_STDINT_H',
            '-DHAVE_STRING_H',
            # Enable dumping stacktrace upon sigaction.
            '-DHAVE_SIGACTION',
            # For logging.cc.
            '-DHAVE_PREAD',

            # Include generated header files.
            '-I%s/glog_internal' % gendir,
        ] + [
            # Use gflags to parse CLI arguments.
            '-DHAVE_LIB_GFLAGS',
        ] if with_gflags else [],
        deps = [
            '@com_github_gflags_gflags//:gflags',
        ] if with_gflags else [],
    )

    native.genrule(
        name = 'gen_sh',
        outs = [
            'gen.sh',
        ],
        cmd = r'''\
#!/bin/sh
cat > $@ <<"EOF"
sed -e 's/@ac_cv_have_unistd_h@/1/g' \
    -e 's/@ac_cv_have_stdint_h@/1/g' \
    -e 's/@ac_cv_have_systypes_h@/1/g' \
    -e 's/@ac_cv_have_libgflags_h@/1/g' \
    -e 's/@ac_cv_have_uint16_t@/1/g' \
    -e 's/@ac_cv_have___builtin_expect@/1/g' \
    -e 's/@ac_cv_have_.*@/0/g' \
    -e 's/@ac_google_start_namespace@/namespace google {/g' \
    -e 's/@ac_google_end_namespace@/}/g' \
    -e 's/@ac_google_namespace@/google/g' \
    -e 's/@ac_cv___attribute___noinline@/__attribute__((noinline))/g' \
    -e 's/@ac_cv___attribute___noreturn@/__attribute__((noreturn))/g' \
    -e 's/@ac_cv___attribute___printf_4_5@/__attribute__((__format__ (__printf__, 4, 5)))/g'
EOF
''',
    )

    native.genrule(
        name = 'config_h',
        srcs = [
            'src/config.h.cmake.in',
        ],
        outs = [
            'glog_internal/config.h',
        ],
        cmd = "awk '{ gsub(/^#cmakedefine/, \"//cmakedefine\"); print; }' $< > $@",
    )

    [native.genrule(
        name = '%s_h' % f,
        srcs = [
            'src/glog/%s.h.in' % f,
        ],
        outs = [
            'src/glog/%s.h' % f,
        ],
        cmd = '$(location :gen_sh) < $< > $@',
        tools = [':gen_sh'],
    ) for f in [
            'vlog_is_on',
            'stl_logging',
            'raw_logging',
            'logging',
        ]
    ]
