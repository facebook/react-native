# frozen_string_literal: true

module ActiveSupport
  module CompareWithRange
    # Extends the default Range#=== to support range comparisons.
    #  (1..5) === (1..5)  # => true
    #  (1..5) === (2..3)  # => true
    #  (1..5) === (1...6) # => true
    #  (1..5) === (2..6)  # => false
    #
    # The native Range#=== behavior is untouched.
    #  ('a'..'f') === ('c') # => true
    #  (5..9) === (11) # => false
    #
    # The given range must be fully bounded, with both start and end.
    def ===(value)
      if value.is_a?(::Range)
        is_backwards_op = value.exclude_end? ? :>= : :>
        return false if value.begin && value.end && value.begin.public_send(is_backwards_op, value.end)
        # 1...10 includes 1..9 but it does not include 1..10.
        # 1..10 includes 1...11 but it does not include 1...12.
        operator = exclude_end? && !value.exclude_end? ? :< : :<=
        value_max = !exclude_end? && value.exclude_end? ? value.max : value.last
        super(value.first) && (self.end.nil? || value_max.public_send(operator, last))
      else
        super
      end
    end

    # Extends the default Range#include? to support range comparisons.
    #  (1..5).include?(1..5)  # => true
    #  (1..5).include?(2..3)  # => true
    #  (1..5).include?(1...6) # => true
    #  (1..5).include?(2..6)  # => false
    #
    # The native Range#include? behavior is untouched.
    #  ('a'..'f').include?('c') # => true
    #  (5..9).include?(11) # => false
    #
    # The given range must be fully bounded, with both start and end.
    def include?(value)
      if value.is_a?(::Range)
        is_backwards_op = value.exclude_end? ? :>= : :>
        return false if value.begin && value.end && value.begin.public_send(is_backwards_op, value.end)
        # 1...10 includes 1..9 but it does not include 1..10.
        # 1..10 includes 1...11 but it does not include 1...12.
        operator = exclude_end? && !value.exclude_end? ? :< : :<=
        value_max = !exclude_end? && value.exclude_end? ? value.max : value.last
        super(value.first) && (self.end.nil? || value_max.public_send(operator, last))
      else
        super
      end
    end
  end
end

Range.prepend(ActiveSupport::CompareWithRange)
