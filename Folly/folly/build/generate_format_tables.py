#!/usr/bin/env python
#
# Generate Format tables


import os
from optparse import OptionParser

OUTPUT_FILE = "FormatTables.cpp"

def generate_table(f, type_name, name, map):
    f.write("extern const {0} {1}[] = {{".format(type_name, name))
    for i in range(0, 256):
        if i % 2 == 0:
            f.write("\n  ")
        f.write("{0}::{1}, ".format(type_name, map.get(chr(i), "INVALID")))
    f.write("\n};\n\n")

def generate_conv_table(f, name, values):
    values = list(values)
    line = ''
    for i, v in enumerate(values):
        if i == 0:
            f.write("extern const char {0}[{1}][{2}] = {{\n".format(
                name, len(values), len(v)))
        row = "{{{0}}}, ".format(", ".join("'{0}'".format(x) for x in v))
        if len(line) + len(row) > 79:
            f.write(line + "\n")
            line = ''
        line += row
    if line:
        f.write(line + "\n")
    f.write("};\n\n")

def octal_values():
    return (tuple("{0:03o}".format(x)) for x in range(512))

def hex_values(upper):
    fmt = "{0:02X}" if upper else "{0:02x}"
    return (tuple(fmt.format(x)) for x in range(256))

def binary_values():
    return (tuple("{0:08b}".format(x)) for x in range(256))

def generate(f):
    f.write("#include <folly/FormatArg.h>\n"
            "\n"
            "namespace folly {\n"
            "namespace detail {\n"
            "\n")

    generate_table(
        f, "FormatArg::Align", "formatAlignTable",
        {"<": "LEFT", ">": "RIGHT", "=": "PAD_AFTER_SIGN", "^": "CENTER"})

    generate_table(
        f, "FormatArg::Sign", "formatSignTable",
        {"+": "PLUS_OR_MINUS", "-": "MINUS", " ": "SPACE_OR_MINUS"})

    generate_conv_table(f, "formatOctal", octal_values())
    generate_conv_table(f, "formatHexLower", hex_values(False))
    generate_conv_table(f, "formatHexUpper", hex_values(True))
    generate_conv_table(f, "formatBinary", binary_values())

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
