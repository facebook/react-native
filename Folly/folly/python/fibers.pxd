from cpython.ref cimport PyObject
from folly cimport cFollyTry

cdef extern from "folly/python/fibers.h" namespace "folly::python":
    void bridgeFibers "folly::python::bridgeFibers"[T](
        T(*)(),
        void(*)(cFollyTry[T]&&, PyObject*),
        PyObject* pyFuture
    )
