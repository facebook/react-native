Warning
=======

These portability headers are **internal implementation details**.

They are intended to ensure that Folly can build on a variety of platforms.

They are not intended to help you build your programs on these platforms.

They are, and will remain, undocumented. They are, and will remain, subject to
rapid, immediate, and drastic changes - including full rewrites and merciless
deletions - without notice.

Note that before adding a new file to this directory you should determine
whether the API you are adding is a portability header or just a platform
dependent implementation detail. Only portability headers belong in this
directory. A portability header is defined as a header that provides the exact
API of some platform or configuration that is not available on all platforms.
If the API being added does not already exist on at least one of the platforms
Folly supports, then it is an implementation detail, and does not belong in
this directory.
