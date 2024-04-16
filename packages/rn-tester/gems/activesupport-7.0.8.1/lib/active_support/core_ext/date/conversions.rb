# frozen_string_literal: true

require "date"
require "active_support/inflector/methods"
require "active_support/core_ext/date/zones"
require "active_support/core_ext/module/redefine_method"

class Date
  DATE_FORMATS = {
    short: "%d %b",
    long: "%B %d, %Y",
    db: "%Y-%m-%d",
    inspect: "%Y-%m-%d",
    number: "%Y%m%d",
    long_ordinal: lambda { |date|
      day_format = ActiveSupport::Inflector.ordinalize(date.day)
      date.strftime("%B #{day_format}, %Y") # => "April 25th, 2007"
    },
    rfc822: "%d %b %Y",
    iso8601: lambda { |date| date.iso8601 }
  }

  # Convert to a formatted string. See DATE_FORMATS for predefined formats.
  #
  # This method is aliased to <tt>to_formatted_s</tt>.
  #
  #   date = Date.new(2007, 11, 10)       # => Sat, 10 Nov 2007
  #
  #   date.to_fs(:db)                     # => "2007-11-10"
  #   date.to_formatted_s(:db)            # => "2007-11-10"
  #
  #   date.to_fs(:short)         # => "10 Nov"
  #   date.to_fs(:number)        # => "20071110"
  #   date.to_fs(:long)          # => "November 10, 2007"
  #   date.to_fs(:long_ordinal)  # => "November 10th, 2007"
  #   date.to_fs(:rfc822)        # => "10 Nov 2007"
  #   date.to_fs(:iso8601)       # => "2007-11-10"
  #
  # == Adding your own date formats to to_fs
  # You can add your own formats to the Date::DATE_FORMATS hash.
  # Use the format name as the hash key and either a strftime string
  # or Proc instance that takes a date argument as the value.
  #
  #   # config/initializers/date_formats.rb
  #   Date::DATE_FORMATS[:month_and_year] = '%B %Y'
  #   Date::DATE_FORMATS[:short_ordinal] = ->(date) { date.strftime("%B #{date.day.ordinalize}") }
  def to_fs(format = :default)
    if formatter = DATE_FORMATS[format]
      if formatter.respond_to?(:call)
        formatter.call(self).to_s
      else
        strftime(formatter)
      end
    else
      to_default_s
    end
  end
  alias_method :to_formatted_s, :to_fs
  alias_method :to_default_s, :to_s

  # Overrides the default inspect method with a human readable one, e.g., "Mon, 21 Feb 2005"
  def readable_inspect
    strftime("%a, %d %b %Y")
  end
  alias_method :default_inspect, :inspect
  alias_method :inspect, :readable_inspect

  silence_redefinition_of_method :to_time

  # Converts a Date instance to a Time, where the time is set to the beginning of the day.
  # The timezone can be either +:local+ or +:utc+ (default +:local+).
  #
  #   date = Date.new(2007, 11, 10)  # => Sat, 10 Nov 2007
  #
  #   date.to_time                   # => 2007-11-10 00:00:00 0800
  #   date.to_time(:local)           # => 2007-11-10 00:00:00 0800
  #
  #   date.to_time(:utc)             # => 2007-11-10 00:00:00 UTC
  #
  # NOTE: The +:local+ timezone is Ruby's *process* timezone, i.e. <tt>ENV['TZ']</tt>.
  # If the <b>application's</b> timezone is needed, then use +in_time_zone+ instead.
  def to_time(form = :local)
    raise ArgumentError, "Expected :local or :utc, got #{form.inspect}." unless [:local, :utc].include?(form)
    ::Time.public_send(form, year, month, day)
  end

  silence_redefinition_of_method :xmlschema

  # Returns a string which represents the time in used time zone as DateTime
  # defined by XML Schema:
  #
  #   date = Date.new(2015, 05, 23)  # => Sat, 23 May 2015
  #   date.xmlschema                 # => "2015-05-23T00:00:00+04:00"
  def xmlschema
    in_time_zone.xmlschema
  end
end
