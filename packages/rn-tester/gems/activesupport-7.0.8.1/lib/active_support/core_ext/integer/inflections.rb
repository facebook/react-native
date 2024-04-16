# frozen_string_literal: true

require "active_support/inflector"

class Integer
  # Ordinalize turns a number into an ordinal string used to denote the
  # position in an ordered sequence such as 1st, 2nd, 3rd, 4th.
  #
  #   1.ordinalize     # => "1st"
  #   2.ordinalize     # => "2nd"
  #   1002.ordinalize  # => "1002nd"
  #   1003.ordinalize  # => "1003rd"
  #   -11.ordinalize   # => "-11th"
  #   -1001.ordinalize # => "-1001st"
  def ordinalize
    ActiveSupport::Inflector.ordinalize(self)
  end

  # Ordinal returns the suffix used to denote the position
  # in an ordered sequence such as 1st, 2nd, 3rd, 4th.
  #
  #   1.ordinal     # => "st"
  #   2.ordinal     # => "nd"
  #   1002.ordinal  # => "nd"
  #   1003.ordinal  # => "rd"
  #   -11.ordinal   # => "th"
  #   -1001.ordinal # => "st"
  def ordinal
    ActiveSupport::Inflector.ordinal(self)
  end
end
