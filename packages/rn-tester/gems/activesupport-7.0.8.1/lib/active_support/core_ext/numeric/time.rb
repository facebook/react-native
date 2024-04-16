# frozen_string_literal: true

require "active_support/duration"
require "active_support/core_ext/time/calculations"
require "active_support/core_ext/time/acts_like"
require "active_support/core_ext/date/calculations"
require "active_support/core_ext/date/acts_like"

class Numeric
  # Returns a Duration instance matching the number of seconds provided.
  #
  #   2.seconds # => 2 seconds
  def seconds
    ActiveSupport::Duration.seconds(self)
  end
  alias :second :seconds

  # Returns a Duration instance matching the number of minutes provided.
  #
  #   2.minutes # => 2 minutes
  def minutes
    ActiveSupport::Duration.minutes(self)
  end
  alias :minute :minutes

  # Returns a Duration instance matching the number of hours provided.
  #
  #   2.hours # => 2 hours
  def hours
    ActiveSupport::Duration.hours(self)
  end
  alias :hour :hours

  # Returns a Duration instance matching the number of days provided.
  #
  #   2.days # => 2 days
  def days
    ActiveSupport::Duration.days(self)
  end
  alias :day :days

  # Returns a Duration instance matching the number of weeks provided.
  #
  #   2.weeks # => 2 weeks
  def weeks
    ActiveSupport::Duration.weeks(self)
  end
  alias :week :weeks

  # Returns a Duration instance matching the number of fortnights provided.
  #
  #   2.fortnights # => 4 weeks
  def fortnights
    ActiveSupport::Duration.weeks(self * 2)
  end
  alias :fortnight :fortnights

  # Returns the number of milliseconds equivalent to the seconds provided.
  # Used with the standard time durations.
  #
  #   2.in_milliseconds # => 2000
  #   1.hour.in_milliseconds # => 3600000
  def in_milliseconds
    self * 1000
  end
end
