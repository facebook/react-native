# frozen_string_literal: true

class String
  # The inverse of <tt>String#include?</tt>. Returns true if the string
  # does not include the other string.
  #
  #   "hello".exclude? "lo" # => false
  #   "hello".exclude? "ol" # => true
  #   "hello".exclude? ?h   # => false
  def exclude?(string)
    !include?(string)
  end
end
