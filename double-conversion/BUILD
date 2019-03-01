# Bazel(http://bazel.io) BUILD file

licenses(["notice"])

cc_library(
    name = "double-conversion",
    srcs = [
        "double-conversion/bignum.cc",
        "double-conversion/bignum-dtoa.cc",
        "double-conversion/cached-powers.cc",
        "double-conversion/diy-fp.cc",
        "double-conversion/double-conversion.cc",
        "double-conversion/fast-dtoa.cc",
        "double-conversion/fixed-dtoa.cc",
        "double-conversion/strtod.cc",
        "double-conversion/utils.h",
    ],
    hdrs = [
        "double-conversion/bignum.h",
        "double-conversion/bignum-dtoa.h",
        "double-conversion/cached-powers.h",
        "double-conversion/diy-fp.h",
        "double-conversion/double-conversion.h",
        "double-conversion/fast-dtoa.h",
        "double-conversion/fixed-dtoa.h",
        "double-conversion/ieee.h",
        "double-conversion/strtod.h",
    ],
    linkopts = [
        "-lm",
    ],
    visibility = ["//visibility:public"],
)

cc_test(
    name = "cctest",
    srcs = [
        "test/cctest/cctest.cc",
        "test/cctest/cctest.h",
        "test/cctest/checks.h",
        "test/cctest/gay-fixed.cc",
        "test/cctest/gay-fixed.h",
        "test/cctest/gay-precision.cc",
        "test/cctest/gay-precision.h",
        "test/cctest/gay-shortest.cc",
        "test/cctest/gay-shortest.h",
        "test/cctest/gay-shortest-single.cc",
        "test/cctest/gay-shortest-single.h",
        "test/cctest/test-bignum.cc",
        "test/cctest/test-bignum-dtoa.cc",
        "test/cctest/test-conversions.cc",
        "test/cctest/test-diy-fp.cc",
        "test/cctest/test-dtoa.cc",
        "test/cctest/test-fast-dtoa.cc",
        "test/cctest/test-fixed-dtoa.cc",
        "test/cctest/test-ieee.cc",
        "test/cctest/test-strtod.cc",
    ],
    args = [
        "test-bignum",
        "test-bignum-dtoa",
        "test-conversions",
        "test-diy-fp",
        "test-dtoa",
        "test-fast-dtoa",
        "test-fixed-dtoa",
        "test-ieee",
        "test-strtod",
    ],
    visibility = ["//visibility:public"],
    deps = [":double-conversion"],
)
