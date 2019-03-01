Exception tracer library

This library allows you to inspect the exception stack at runtime.
The library can be used in three ways:

1. Link in the exception_tracer_base library.  You get access to the functions
in ExceptionTracer.h, but no stack traces.  This has no runtime overhead,
and is compliant with the C++ ABI.

2. Link in the (full) exception_tracer library.  You get access to the
functions in ExceptionTracer.h, the std::terminate and std::unexpected
handlers are installed by default, and you get full stack traces with
all exceptions.  This has some runtime overhead (the stack trace must be
captured and stored whenever an exception is thrown) added to throw
and catch, but no runtime overhead otherwise.  This is less portable
(depends on internal details of GNU's libstdc++).

3. LD_PRELOAD libexceptiontracer.so.  This is equivalent to #2 above, but
requires no link-time changes.  On the other hand, you need to ensure that
libexceptiontracer.so is compiled with the same compiler and flags as
your binary, and the usual caveats about LD_PRELOAD apply (it propagates
to child processes, etc).
