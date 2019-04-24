from libcpp.memory cimport unique_ptr
from folly cimport cFollyExecutor

cdef extern from "folly/python/AsyncioExecutor.h" namespace "folly::python":
    cdef cppclass cAsyncioExecutor "folly::python::AsyncioExecutor"(cFollyExecutor):
        int fileno()
        void drive()

cdef class AsyncioExecutor:
    cdef unique_ptr[cAsyncioExecutor] cQ

cdef api cAsyncioExecutor* get_executor()
