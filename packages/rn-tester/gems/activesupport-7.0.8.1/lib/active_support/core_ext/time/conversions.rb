# frozen_string_literal: true

require "time"
require "active_support/inflector/methods"
require "active_support/values/time_zone"

class Time
  DATE_FORMATS = {
    db: "%Y-%m-%d %H:%M:%S",
    inspect: "%Y-%m-%d %H:%M:%S.%9N %z",
    number: "%Y%m%d%H%M%S",
    nsec: "%Y%m%d%H%M%S%9N",
    usec: "%Y%m%d%H%M%S%6N",
    time: "%H:%M",
    short: "%d %b %H:%M",
    long: "%B %d, %Y %H:%M",
    long_ordinal: lambda { |time|
      day_format = ActiveSupport::Inflector.ordinalize(time.day)
      time.strftime("%B #{day_format}, %Y %H:%M")
    },
    rfc822: lambda { |time|
      offset_format = time.formatted_offset(false)
      time.strftime("%a, %d %b %Y %H:%M:%S #{offset_format}")
    },
    iso8601: lambda { |time| time.iso8601 }
  }

  # Converts to a formatted string. See DATE_FORMATS for built-in formats.
  #
  # This method is aliased to <tt>to_formatted_s</tt>.
  #
  #   time = Time.now                    # => 2007-01-18 06:10:17 -06:00
  #
  #   time.to_fs(:time)                  # => "06:10"
  #   time.to_formatted_s(:time)         # => "06:10"
  #
  #   time.to_fs(:db)           # => "2007-01-18 06:10:17"
  #   time.to_fs(:number)       # => "20070118061017"
  #   time.to_fs(:short)        # => "18 Jan 06:10"
  #   time.to_fs(:long)         # => "January 18, 2007 06:10"
  #   time.to_fs(:long_ordinal) # => "January 18th, 2007 06:10"
  #   time.to_fs(:rfc822)       # => "Thu, 18 Jan 2007 06:10:17 -0600"
  #   time.to_fs(:iso8601)      # => "2007-01-18T06:10:17-06:00"
  #
  # == Adding your own time formats to +to_fs+
  # You can add your own formats to the Time::DATE_FORMATS hash.
  # Use the format name as the hash key and either a strftime string
  # or Proc instance that takes a time argument as the value.
  #
  #   # config/initializers/time_formats.rb
  #   Time::DATE_FORMATS[:month_and_year] = '%B %Y'
  #   Time::DATE_FORMATS[:short_ordinal]  = ->(time) { time.strftime("%B #{time.day.ordinalize}") }
  def to_fs(format = :default)
    if formatter = DATE_FORMATS[format]
      formatter.respond_to?(:call) ? formatter.call(self).to_s : strftime(formatter)
    else
      # Change to `to_s` when deprecation is gone. Also deprecate `to_default_s`.
      to_default_s
    end
  end
  alias_method :to_formatted_s, :to_fs
  alias_method :to_default_s, :to_s

  # Returns a formatted string of the offset from UTC, or an alternative
  # string if the time zone is already UTC.
  #
  #   Time.local(2000).formatted_offset        # => "-06:00"
  #   Time.local(2000).formatted_offset(false) # => "-0600"
  def formatted_offset(colon = true, alternate_utc_string = nil)
    utc? && alternate_utc_string || ActiveSupport::TimeZone.seconds_to_utc_offset(utc_offset, colon)
  end

  # Aliased to +xmlschema+ for compatibility with +DateTime+
  alias_method :rfc3339, :xmlschema
end
