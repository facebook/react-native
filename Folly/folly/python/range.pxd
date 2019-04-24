cdef extern from "folly/Range.h" namespace "folly":
    cdef cppclass Range[T]:
        Range()
        Range(T, int)
        T data()
        int size()

ctypedef Range[const char*] StringPiece
ctypedef Range[const unsigned char*] ByteRange

ctypedef fused R:
    StringPiece
    ByteRange

# Conversion Helpers
cdef inline bytes to_bytes(R range):
    return <bytes>range.data()[:range.size()]
