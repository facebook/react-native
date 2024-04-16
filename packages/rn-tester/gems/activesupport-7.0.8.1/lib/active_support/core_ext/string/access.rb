# frozen_string_literal: true

class String
  # If you pass a single integer, returns a substring of one character at that
  # position. The first character of the string is at position 0, the next at
  # position 1, and so on. If a range is supplied, a substring containing
  # characters at offsets given by the range is returned. In both cases, if an
  # offset is negative, it is counted from the end of the string. Returns +nil+
  # if the initial offset falls outside the string. Returns an empty string if
  # the beginning of the range is greater than the end of the string.
  #
  #   str = "hello"
  #   str.at(0)      # => "h"
  #   str.at(1..3)   # => "ell"
  #   str.at(-2)     # => "l"
  #   str.at(-2..-1) # => "lo"
  #   str.at(5)      # => nil
  #   str.at(5..-1)  # => ""
  #
  # If a Regexp is given, the matching portion of the string is returned.
  # If a String is given, that given string is returned if it occurs in
  # the string. In both cases, +nil+ is returned if there is no match.
  #
  #   str = "hello"
  #   str.at(/lo/) # => "lo"
  #   str.at(/ol/) # => nil
  #   str.at("lo") # => "lo"
  #   str.at("ol") # => nil
  def at(position)
    self[position]
  end

  # Returns a substring from the given position to the end of the string.
  # If the position is negative, it is counted from the end of the string.
  #
  #   str = "hello"
  #   str.from(0)  # => "hello"
  #   str.from(3)  # => "lo"
  #   str.from(-2) # => "lo"
  #
  # You can mix it with +to+ method and do fun things like:
  #
  #   str = "hello"
  #   str.from(0).to(-1) # => "hello"
  #   str.from(1).to(-2) # => "ell"
  def from(position)
    self[position, length]
  end

  # Returns a substring from the beginning of the string to the given position.
  # If the position is negative, it is counted from the end of the string.
  #
  #   str = "hello"
  #   str.to(0)  # => "h"
  #   str.to(3)  # => "hell"
  #   str.to(-2) # => "hell"
  #
  # You can mix it with +from+ method and do fun things like:
  #
  #   str = "hello"
  #   str.from(0).to(-1) # => "hello"
  #   str.from(1).to(-2) # => "ell"
  def to(position)
    position += size if position < 0
    self[0, position + 1] || +""
  end

  # Returns the first character. If a limit is supplied, returns a substring
  # from the beginning of the string until it reaches the limit value. If the
  # given limit is greater than or equal to the string length, returns a copy of self.
  #
  #   str = "hello"
  #   str.first    # => "h"
  #   str.first(1) # => "h"
  #   str.first(2) # => "he"
  #   str.first(0) # => ""
  #   str.first(6) # => "hello"
  def first(limit = 1)
    self[0, limit] || raise(ArgumentError, "negative limit")
  end

  # Returns the last character of the string. If a limit is supplied, returns a substring
  # from the end of the string until it reaches the limit value (counting backwards). If
  # the given limit is greater than or equal to the string length, returns a copy of self.
  #
  #   str = "hello"
  #   str.last    # => "o"
  #   str.last(1) # => "o"
  #   str.last(2) # => "lo"
  #   str.last(0) # => ""
  #   str.last(6) # => "hello"
  def last(limit = 1)
    self[[length - limit, 0].max, limit] || raise(ArgumentError, "negative limit")
  end
end
