#!/usr/bin/env python
#
# Generate Escape tables.
# Copyright 2011 Facebook
#
# @author Tudor Bosman (tudorb@fb.com)
#
import os
from optparse import OptionParser

OUTPUT_FILE = "EscapeTables.cpp"

def generate(f):
    f.write("namespace folly {\n"
            "namespace detail {\n"
            "\n")

    f.write("extern const char cEscapeTable[] =\n")
    escapes = dict((
        ('"', '\\"'),
        ('\\', '\\\\'),
        ('?', '?'),
        ('\n', 'n'),
        ('\r', 'r'),
        ('\t', 't'),
    ))
    for i in range(0, 256):
        if i % 64 == 0:
            if i != 0:
                f.write("\"\n")
            f.write("  \"")
        c = chr(i)
        if c in escapes:
            c = escapes[c]
        elif i < 32 or i > 126:
            c = 'O'  # octal
        else:
            c = 'P'  # printable
        f.write(c)
    f.write("\";\n\n")

    f.write("extern const char cUnescapeTable[] =\n")
    for i in range(0, 256):
        if i % 64 == 0:
            if i != 0:
                f.write("\"\n")
            f.write("  \"")
        c = chr(i)
        if c in '\'?':
            f.write(c)
        elif c in '"\\abfnrtv':
            f.write("\\" + c)
        elif i >= ord('0') and i <= ord('7'):
            f.write("O")  # octal
        elif c == "x":
            f.write("X")  # hex
        else:
            f.write("I")  # invalid
    f.write("\";\n\n")

    f.write("extern const unsigned char hexTable[] = {")
    for i in range(0, 256):
        if i % 16 == 0:
            f.write("\n  ")
        if i >= ord('0') and i <= ord('9'):
            f.write("{0:2d}, ".format(i - ord('0')))
        elif i >= ord('a') and i <= ord('f'):
            f.write("{0:2d}, ".format(i - ord('a') + 10))
        elif i >= ord('A') and i <= ord('F'):
            f.write("{0:2d}, ".format(i - ord('A') + 10))
        else:
            f.write("16, ")
    f.write("\n};\n\n")

    # 0 = passthrough
    # 1 = unused
    # 2 = safe in path (/)
    # 3 = space (replace with '+' in query)
    # 4 = always percent-encode
    f.write("extern const unsigned char uriEscapeTable[] = {")
    passthrough = (
        list(map(ord, '0123456789')) +
        list(map(ord, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')) +
        list(map(ord, 'abcdefghijklmnopqrstuvwxyz')) +
        list(map(ord, '-_.~')))
    for i in range(0, 256):
        if i % 16 == 0:
            f.write("\n  ")
        if i in passthrough:
            f.write("0, ")
        elif i == ord('/'):
            f.write("2, ")
        elif i == ord(' '):
            f.write("3, ")
        else:
            f.write("4, ")
    f.write("\n};\n\n")

    f.write("}  // namespace detail\n"
            "}  // namespace folly\n")

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
