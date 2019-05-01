from libcpp cimport bool as cbool

cdef extern from "folly/ExceptionWrapper.h" namespace "folly":
    cdef cppclass cFollyExceptionWrapper "folly::exception_wrapper":
        void throw_exception() except +

cdef extern from "folly/Try.h" namespace "folly" nogil:
    cdef cppclass cFollyTry "folly::Try"[T]:
        T value()
        cbool hasException[T]()
        cbool hasException()
        cFollyExceptionWrapper exception()

cdef extern from "folly/futures/Future.h" namespace "folly" nogil:
    cdef cppclass cFollyFuture "folly::Future"[T]:
        T get()
        cbool hasValue()
        #TODO add via and then

cdef extern from "folly/Unit.h" namespace "folly":
    struct cFollyUnit "folly::Unit":
        pass

    cFollyUnit c_unit "folly::unit"

cdef extern from "folly/futures/Promise.h" namespace "folly":
    cdef cppclass cFollyPromise "folly::Promise"[T]:
        cFollyPromise()
        void setValue[M](M& value)
        void setException[E](E& value)
        cFollyFuture[T] getFuture()

cdef extern from "folly/Executor.h" namespace "folly":
    cdef cppclass cFollyExecutor "folly::Executor":
        pass
