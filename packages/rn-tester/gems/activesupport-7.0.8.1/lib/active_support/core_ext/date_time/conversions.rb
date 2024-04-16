# frozen_string_literal: true

require "date"
require "active_support/inflector/methods"
require "active_support/core_ext/time/conversions"
require "active_support/core_ext/date_time/calculations"
require "active_support/values/time_zone"

class DateTime
  # Convert to a formatted string. See Time::DATE_FORMATS for predefined formats.
  #
  # This method is aliased to <tt>to_formatted_s</tt>.
  #
  # === Examples
  #   datetime = DateTime.civil(2007, 12, 4, 0, 0, 0, 0)   # => Tue, 04 Dec 2007 00:00:00 +0000
  #
  #   datetime.to_fs(:db)            # => "2007-12-04 00:00:00"
  #   datetime.to_formatted_s(:db)   # => "2007-12-04 00:00:00"
  #   datetime.to_fs(:number)        # => "20071204000000"
  #   datetime.to_fs(:short)         # => "04 Dec 00:00"
  #   datetime.to_fs(:long)          # => "December 04, 2007 00:00"
  #   datetime.to_fs(:long_ordinal)  # => "December 4th, 2007 00:00"
  #   datetime.to_fs(:rfc822)        # => "Tue, 04 Dec 2007 00:00:00 +0000"
  #   datetime.to_fs(:iso8601)       # => "2007-12-04T00:00:00+00:00"
  #
  # == Adding your own datetime formats to to_fs
  # DateTime formats are shared with Time. You can add your own to the
  # Time::DATE_FORMATS hash. Use the format name as the hash key and
  # either a strftime string or Proc instance that takes a time or
  # datetime argument as the value.
  #
  #   # config/initializers/time_formats.rb
  #   Time::DATE_FORMATS[:month_and_year] = '%B %Y'
  #   Time::DATE_FORMATS[:short_ordinal] = lambda { |time| time.strftime("%B #{time.day.ordinalize}") }
  def to_fs(format = :default)
    if formatter = ::Time::DATE_FORMATS[format]
      formatter.respond_to?(:call) ? formatter.call(self).to_s : strftime(formatter)
    else
      to_default_s
    end
  end
  alias_method :to_formatted_s, :to_fs
  alias_method :to_default_s, :to_s if instance_methods(false).include?(:to_s)

  # Returns a formatted string of the offset from UTC, or an alternative
  # string if the time zone is already UTC.
  #
  #   datetime = DateTime.civil(2000, 1, 1, 0, 0, 0, Rational(-6, 24))
  #   datetime.formatted_offset         # => "-06:00"
  #   datetime.formatted_offset(false)  # => "-0600"
  def formatted_offset(colon = true, alternate_utc_string = nil)
    utc? && alternate_utc_string || ActiveSupport::TimeZone.seconds_to_utc_offset(utc_offset, colon)
  end

  # Overrides the default inspect method with a human readable one, e.g., "Mon, 21 Feb 2005 14:30:00 +0000".
  def readable_inspect
    to_fs(:rfc822)
  end
  alias_method :default_inspect, :inspect
  alias_method :inspect, :readable_inspect

  # Returns DateTime with local offset for given year if format is local else
  # offset is zero.
  #
  #   DateTime.civil_from_format :local, 2012
  #   # => Sun, 01 Jan 2012 00:00:00 +0300
  #   DateTime.civil_from_format :local, 2012, 12, 17
  #   # => Mon, 17 Dec 2012 00:00:00 +0000
  def self.civil_from_format(utc_or_local, year, month = 1, day = 1, hour = 0, min = 0, sec = 0)
    if utc_or_local.to_sym == :local
      offset = ::Time.local(year, month, day).utc_offset.to_r / 86400
    else
      offset = 0
    end
    civil(year, month, day, hour, min, sec, offset)
  end

  # Converts +self+ to a floating-point number of seconds, including fractional microseconds, since the Unix epoch.
  def to_f
    seconds_since_unix_epoch.to_f + sec_fraction
  end

  # Converts +self+ to an integer number of seconds since the Unix epoch.
  def to_i
    seconds_since_unix_epoch.to_i
  end

  # Returns the fraction of a second as microseconds
  def usec
    (sec_fraction * 1_000_000).to_i
  end

  # Returns the fraction of a second as nanoseconds
  def nsec
    (sec_fraction * 1_000_000_000).to_i
  end

  private
    def offset_in_seconds
      (offset * 86400).to_i
    end

    def seconds_since_unix_epoch
      (jd - 2440588) * 86400 - offset_in_seconds + seconds_since_midnight
    end
end
