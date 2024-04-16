# frozen_string_literal: true

require "date"
require "active_support/duration"
require "active_support/core_ext/object/acts_like"
require "active_support/core_ext/date/zones"
require "active_support/core_ext/time/zones"
require "active_support/core_ext/date_and_time/calculations"

class Date
  include DateAndTime::Calculations

  class << self
    attr_accessor :beginning_of_week_default

    # Returns the week start (e.g. +:monday+) for the current request, if this has been set (via Date.beginning_of_week=).
    # If <tt>Date.beginning_of_week</tt> has not been set for the current request, returns the week start specified in <tt>config.beginning_of_week</tt>.
    # If no +config.beginning_of_week+ was specified, returns +:monday+.
    def beginning_of_week
      ::ActiveSupport::IsolatedExecutionState[:beginning_of_week] || beginning_of_week_default || :monday
    end

    # Sets <tt>Date.beginning_of_week</tt> to a week start (e.g. +:monday+) for current request/thread.
    #
    # This method accepts any of the following day symbols:
    # +:monday+, +:tuesday+, +:wednesday+, +:thursday+, +:friday+, +:saturday+, +:sunday+
    def beginning_of_week=(week_start)
      ::ActiveSupport::IsolatedExecutionState[:beginning_of_week] = find_beginning_of_week!(week_start)
    end

    # Returns week start day symbol (e.g. +:monday+), or raises an +ArgumentError+ for invalid day symbol.
    def find_beginning_of_week!(week_start)
      raise ArgumentError, "Invalid beginning of week: #{week_start}" unless ::Date::DAYS_INTO_WEEK.key?(week_start)
      week_start
    end

    # Returns a new Date representing the date 1 day ago (i.e. yesterday's date).
    def yesterday
      ::Date.current.yesterday
    end

    # Returns a new Date representing the date 1 day after today (i.e. tomorrow's date).
    def tomorrow
      ::Date.current.tomorrow
    end

    # Returns Time.zone.today when <tt>Time.zone</tt> or <tt>config.time_zone</tt> are set, otherwise just returns Date.today.
    def current
      ::Time.zone ? ::Time.zone.today : ::Date.today
    end
  end

  # Converts Date to a Time (or DateTime if necessary) with the time portion set to the beginning of the day (0:00)
  # and then subtracts the specified number of seconds.
  def ago(seconds)
    in_time_zone.since(-seconds)
  end

  # Converts Date to a Time (or DateTime if necessary) with the time portion set to the beginning of the day (0:00)
  # and then adds the specified number of seconds
  def since(seconds)
    in_time_zone.since(seconds)
  end
  alias :in :since

  # Converts Date to a Time (or DateTime if necessary) with the time portion set to the beginning of the day (0:00)
  def beginning_of_day
    in_time_zone
  end
  alias :midnight :beginning_of_day
  alias :at_midnight :beginning_of_day
  alias :at_beginning_of_day :beginning_of_day

  # Converts Date to a Time (or DateTime if necessary) with the time portion set to the middle of the day (12:00)
  def middle_of_day
    in_time_zone.middle_of_day
  end
  alias :midday :middle_of_day
  alias :noon :middle_of_day
  alias :at_midday :middle_of_day
  alias :at_noon :middle_of_day
  alias :at_middle_of_day :middle_of_day

  # Converts Date to a Time (or DateTime if necessary) with the time portion set to the end of the day (23:59:59)
  def end_of_day
    in_time_zone.end_of_day
  end
  alias :at_end_of_day :end_of_day

  def plus_with_duration(other) # :nodoc:
    if ActiveSupport::Duration === other
      other.since(self)
    else
      plus_without_duration(other)
    end
  end
  alias_method :plus_without_duration, :+
  alias_method :+, :plus_with_duration

  def minus_with_duration(other) # :nodoc:
    if ActiveSupport::Duration === other
      plus_with_duration(-other)
    else
      minus_without_duration(other)
    end
  end
  alias_method :minus_without_duration, :-
  alias_method :-, :minus_with_duration

  # Provides precise Date calculations for years, months, and days. The +options+ parameter takes a hash with
  # any of these keys: <tt>:years</tt>, <tt>:months</tt>, <tt>:weeks</tt>, <tt>:days</tt>.
  #
  # The increments are applied in order of time units from largest to smallest.
  # In other words, the date is incremented first by +:years+, then by
  # +:months+, then by +:weeks+, then by +:days+. This order can affect the
  # result around the end of a month. For example, incrementing first by months
  # then by days:
  #
  #   Date.new(2004, 9, 30).advance(months: 1, days: 1)
  #   # => Sun, 31 Oct 2004
  #
  # Whereas incrementing first by days then by months yields a different result:
  #
  #   Date.new(2004, 9, 30).advance(days: 1).advance(months: 1)
  #   # => Mon, 01 Nov 2004
  #
  def advance(options)
    d = self

    d = d >> options[:years] * 12 if options[:years]
    d = d >> options[:months] if options[:months]
    d = d + options[:weeks] * 7 if options[:weeks]
    d = d + options[:days] if options[:days]

    d
  end

  # Returns a new Date where one or more of the elements have been changed according to the +options+ parameter.
  # The +options+ parameter is a hash with a combination of these keys: <tt>:year</tt>, <tt>:month</tt>, <tt>:day</tt>.
  #
  #   Date.new(2007, 5, 12).change(day: 1)               # => Date.new(2007, 5, 1)
  #   Date.new(2007, 5, 12).change(year: 2005, month: 1) # => Date.new(2005, 1, 12)
  def change(options)
    ::Date.new(
      options.fetch(:year, year),
      options.fetch(:month, month),
      options.fetch(:day, day)
    )
  end

  # Allow Date to be compared with Time by converting to DateTime and relying on the <=> from there.
  def compare_with_coercion(other)
    if other.is_a?(Time)
      to_datetime <=> other
    else
      compare_without_coercion(other)
    end
  end
  alias_method :compare_without_coercion, :<=>
  alias_method :<=>, :compare_with_coercion
end
