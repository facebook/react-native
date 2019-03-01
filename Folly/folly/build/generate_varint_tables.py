#!/usr/bin/env python
#
# Generate tables for GroupVarint32
# Copyright 2011 Facebook
#
# @author Tudor Bosman (tudorb@fb.com)
#
# Reference: http://www.stepanovpapers.com/CIKM_2011.pdf
#
# From 17 encoded bytes, we may use between 5 and 17 bytes to encode 4
# integers.  The first byte is a key that indicates how many bytes each of
# the 4 integers takes:
#
# bit 0..1: length-1 of first integer
# bit 2..3: length-1 of second integer
# bit 4..5: length-1 of third integer
# bit 6..7: length-1 of fourth integer
#
# The value of the first byte is used as the index in a table which returns
# a mask value for the SSSE3 PSHUFB instruction, which takes an XMM register
# (16 bytes) and shuffles bytes from it into a destination XMM register
# (optionally setting some of them to 0)
#
# For example, if the key has value 4, that means that the first integer
# uses 1 byte, the second uses 2 bytes, the third and fourth use 1 byte each,
# so we set the mask value so that
#
# r[0] = a[0]
# r[1] = 0
# r[2] = 0
# r[3] = 0
#
# r[4] = a[1]
# r[5] = a[2]
# r[6] = 0
# r[7] = 0
#
# r[8] = a[3]
# r[9] = 0
# r[10] = 0
# r[11] = 0
#
# r[12] = a[4]
# r[13] = 0
# r[14] = 0
# r[15] = 0

import os
from optparse import OptionParser

OUTPUT_FILE = "GroupVarintTables.cpp"

def generate(f):
    f.write("""
#include <folly/Portability.h>

#include <stdint.h>

namespace folly {
namespace detail {

#if (FOLLY_X64 || defined(__i386__)) && (FOLLY_SSE >= 2)
alignas(16) extern const uint64_t groupVarintSSEMasks[512] = {
""")

    # Compute SSE masks
    for i in range(0, 256):
        offset = 0
        vals = [0, 0, 0, 0]
        for j in range(0, 4):
            d = 1 + ((i >> (2 * j)) & 3)
            # the j'th integer uses d bytes, consume them
            for k in range(0, d):
                vals[j] |= offset << (8 * k)
                offset += 1
            # set remaining bytes in result to 0
            # 0xff: set corresponding byte in result to 0
            for k in range(d, 4):
                vals[j] |= 0xff << (8 * k)
        f.write("  0x{1:08x}{0:08x}ULL, "
            "0x{3:08x}{2:08x}ULL,\n".format(*vals))

    f.write("};\n"
        "#endif /*#if (FOLLY_X64 || defined(__i386__)) && (FOLLY_SSE >= 2)*/\n"
        "\n"
        "extern const uint8_t groupVarintLengths[] = {\n")

    # Also compute total encoded lengths, including key byte
    for i in range(0, 256):
        offset = 1  # include key byte
        for j in range(0, 4):
            d = 1 + ((i >> (2 * j)) & 3)
            offset += d
        f.write("  {0},\n".format(offset))

    f.write("""
};

}  // namespace detail
}  // namespace folly
""")

def main():
    parser = OptionParser()
    parser.add_option("--install_dir", dest="install_dir", default=".",
                      help="write output to DIR", metavar="DIR")
    parser.add_option("--fbcode_dir")
    (options, args) = parser.parse_args()
    f = open(os.path.join(options.install_dir, OUTPUT_FILE), "w")
    generate(f)
    f.close()

if __name__ == "__main__":
    main()
