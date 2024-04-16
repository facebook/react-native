# frozen_string_literal: true

require "active_support/duration"
require "active_support/core_ext/numeric/time"

class Integer
  # Returns a Duration instance matching the number of months provided.
  #
  #   2.months # => 2 months
  def months
    ActiveSupport::Duration.months(self)
  end
  alias :month :months

  # Returns a Duration instance matching the number of years provided.
  #
  #   2.years # => 2 years
  def years
    ActiveSupport::Duration.years(self)
  end
  alias :year :years
end
