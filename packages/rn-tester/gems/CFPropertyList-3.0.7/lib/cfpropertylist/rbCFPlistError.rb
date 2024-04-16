# -*- coding: utf-8 -*-
#
# Exceptions used:
# CFPlistError:: General base exception
# CFFormatError:: Format error
# CFTypeError:: Type error
#
# Easy and simple :-)
#
# Author::    Christian Kruse (mailto:cjk@wwwtech.de)
# Copyright:: Copyright (c) 2010
# License::   MIT License

# general plist error. All exceptions thrown are derived from this class.
class CFPlistError < StandardError
end

# Exception thrown when format errors occur
class CFFormatError < CFPlistError
end

# Exception thrown when type errors occur
class CFTypeError < CFPlistError
end

# eof
