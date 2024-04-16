# frozen_string_literal: true

class Integer
  # Check whether the integer is evenly divisible by the argument.
  #
  #   0.multiple_of?(0)  # => true
  #   6.multiple_of?(5)  # => false
  #   10.multiple_of?(2) # => true
  def multiple_of?(number)
    number == 0 ? self == 0 : self % number == 0
  end
end
