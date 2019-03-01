https://github.com/google/double-conversion

This project (double-conversion) provides binary-decimal and decimal-binary
routines for IEEE doubles.

The library consists of efficient conversion routines that have been extracted
from the V8 JavaScript engine. The code has been refactored and improved so that
it can be used more easily in other projects.

There is extensive documentation in `double-conversion/double-conversion.h`. Other 
examples can be found in `test/cctest/test-conversions.cc`.


Building
========

This library can be built with [scons][0] or [cmake][1].
The checked-in Makefile simply forwards to scons, and provides a
shortcut to run all tests:

    make
    make test

Scons
-----

The easiest way to install this library is to use `scons`. It builds
the static and shared library, and is set up to install those at the
correct locations:

    scons install

Use the `DESTDIR` option to change the target directory:

    scons DESTDIR=alternative_directory install

Cmake
-----

To use cmake run `cmake .` in the root directory. This overwrites the
existing Makefile.

Use `-DBUILD_SHARED_LIBS=ON` to enable the compilation of shared libraries.
Note that this disables static libraries. There is currently no way to
build both libraries at the same time with cmake.

Use `-DBUILD_TESTING=ON` to build the test executable.

    cmake . -DBUILD_TESTING=ON
    make
    test/cctest/cctest --list | tr -d '<' | xargs test/cctest/cctest

[0]: http://www.scons.org/
[1]: https://cmake.org/
