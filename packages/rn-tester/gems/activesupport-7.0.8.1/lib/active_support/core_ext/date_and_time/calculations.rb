# frozen_string_literal: true

require "active_support/core_ext/object/try"
require "active_support/core_ext/date_time/conversions"

module DateAndTime
  module Calculations
    DAYS_INTO_WEEK = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    }
    WEEKEND_DAYS = [ 6, 0 ]

    # Returns a new date/time representing yesterday.
    def yesterday
      advance(days: -1)
    end

    # Returns a new date/time representing tomorrow.
    def tomorrow
      advance(days: 1)
    end

    # Returns true if the date/time is today.
    def today?
      to_date == ::Date.current
    end

    # Returns true if the date/time is tomorrow.
    def tomorrow?
      to_date == ::Date.current.tomorrow
    end
    alias :next_day? :tomorrow?

    # Returns true if the date/time is yesterday.
    def yesterday?
      to_date == ::Date.current.yesterday
    end
    alias :prev_day? :yesterday?

    # Returns true if the date/time is in the past.
    def past?
      self < self.class.current
    end

    # Returns true if the date/time is in the future.
    def future?
      self > self.class.current
    end

    # Returns true if the date/time falls on a Saturday or Sunday.
    def on_weekend?
      WEEKEND_DAYS.include?(wday)
    end

    # Returns true if the date/time does not fall on a Saturday or Sunday.
    def on_weekday?
      !WEEKEND_DAYS.include?(wday)
    end

    # Returns true if the date/time falls before <tt>date_or_time</tt>.
    def before?(date_or_time)
      self < date_or_time
    end

    # Returns true if the date/time falls after <tt>date_or_time</tt>.
    def after?(date_or_time)
      self > date_or_time
    end

    # Returns a new date/time the specified number of days ago.
    def days_ago(days)
      advance(days: -days)
    end

    # Returns a new date/time the specified number of days in the future.
    def days_since(days)
      advance(days: days)
    end

    # Returns a new date/time the specified number of weeks ago.
    def weeks_ago(weeks)
      advance(weeks: -weeks)
    end

    # Returns a new date/time the specified number of weeks in the future.
    def weeks_since(weeks)
      advance(weeks: weeks)
    end

    # Returns a new date/time the specified number of months ago.
    def months_ago(months)
      advance(months: -months)
    end

    # Returns a new date/time the specified number of months in the future.
    def months_since(months)
      advance(months: months)
    end

    # Returns a new date/time the specified number of years ago.
    def years_ago(years)
      advance(years: -years)
    end

    # Returns a new date/time the specified number of years in the future.
    def years_since(years)
      advance(years: years)
    end

    # Returns a new date/time at the start of the month.
    #
    #   today = Date.today # => Thu, 18 Jun 2015
    #   today.beginning_of_month # => Mon, 01 Jun 2015
    #
    # +DateTime+ objects will have a time set to 0:00.
    #
    #   now = DateTime.current # => Thu, 18 Jun 2015 15:23:13 +0000
    #   now.beginning_of_month # => Mon, 01 Jun 2015 00:00:00 +0000
    def beginning_of_month
      first_hour(change(day: 1))
    end
    alias :at_beginning_of_month :beginning_of_month

    # Returns a new date/time at the start of the quarter.
    #
    #   today = Date.today # => Fri, 10 Jul 2015
    #   today.beginning_of_quarter # => Wed, 01 Jul 2015
    #
    # +DateTime+ objects will have a time set to 0:00.
    #
    #   now = DateTime.current # => Fri, 10 Jul 2015 18:41:29 +0000
    #   now.beginning_of_quarter # => Wed, 01 Jul 2015 00:00:00 +0000
    def beginning_of_quarter
      first_quarter_month = month - (2 + month) % 3
      beginning_of_month.change(month: first_quarter_month)
    end
    alias :at_beginning_of_quarter :beginning_of_quarter

    # Returns a new date/time at the end of the quarter.
    #
    #   today = Date.today # => Fri, 10 Jul 2015
    #   today.end_of_quarter # => Wed, 30 Sep 2015
    #
    # +DateTime+ objects will have a time set to 23:59:59.
    #
    #   now = DateTime.current # => Fri, 10 Jul 2015 18:41:29 +0000
    #   now.end_of_quarter # => Wed, 30 Sep 2015 23:59:59 +0000
    def end_of_quarter
      last_quarter_month = month + (12 - month) % 3
      beginning_of_month.change(month: last_quarter_month).end_of_month
    end
    alias :at_end_of_quarter :end_of_quarter

    # Returns a new date/time at the beginning of the year.
    #
    #   today = Date.today # => Fri, 10 Jul 2015
    #   today.beginning_of_year # => Thu, 01 Jan 2015
    #
    # +DateTime+ objects will have a time set to 0:00.
    #
    #   now = DateTime.current # => Fri, 10 Jul 2015 18:41:29 +0000
    #   now.beginning_of_year # => Thu, 01 Jan 2015 00:00:00 +0000
    def beginning_of_year
      change(month: 1).beginning_of_month
    end
    alias :at_beginning_of_year :beginning_of_year

    # Returns a new date/time representing the given day in the next week.
    #
    #   today = Date.today # => Thu, 07 May 2015
    #   today.next_week    # => Mon, 11 May 2015
    #
    # The +given_day_in_next_week+ defaults to the beginning of the week
    # which is determined by +Date.beginning_of_week+ or +config.beginning_of_week+
    # when set.
    #
    #   today = Date.today       # => Thu, 07 May 2015
    #   today.next_week(:friday) # => Fri, 15 May 2015
    #
    # +DateTime+ objects have their time set to 0:00 unless +same_time+ is true.
    #
    #   now = DateTime.current # => Thu, 07 May 2015 13:31:16 +0000
    #   now.next_week      # => Mon, 11 May 2015 00:00:00 +0000
    def next_week(given_day_in_next_week = Date.beginning_of_week, same_time: false)
      result = first_hour(weeks_since(1).beginning_of_week.days_since(days_span(given_day_in_next_week)))
      same_time ? copy_time_to(result) : result
    end

    # Returns a new date/time representing the next weekday.
    def next_weekday
      if next_day.on_weekend?
        next_week(:monday, same_time: true)
      else
        next_day
      end
    end

    # Short-hand for <tt>months_since(3)</tt>.
    def next_quarter
      months_since(3)
    end

    # Returns a new date/time representing the given day in the previous week.
    # Week is assumed to start on +start_day+, default is
    # +Date.beginning_of_week+ or +config.beginning_of_week+ when set.
    # DateTime objects have their time set to 0:00 unless +same_time+ is true.
    def prev_week(start_day = Date.beginning_of_week, same_time: false)
      result = first_hour(weeks_ago(1).beginning_of_week.days_since(days_span(start_day)))
      same_time ? copy_time_to(result) : result
    end
    alias_method :last_week, :prev_week

    # Returns a new date/time representing the previous weekday.
    def prev_weekday
      if prev_day.on_weekend?
        copy_time_to(beginning_of_week(:friday))
      else
        prev_day
      end
    end
    alias_method :last_weekday, :prev_weekday

    # Short-hand for <tt>months_ago(1)</tt>.
    def last_month
      months_ago(1)
    end

    # Short-hand for <tt>months_ago(3)</tt>.
    def prev_quarter
      months_ago(3)
    end
    alias_method :last_quarter, :prev_quarter

    # Short-hand for <tt>years_ago(1)</tt>.
    def last_year
      years_ago(1)
    end

    # Returns the number of days to the start of the week on the given day.
    # Week is assumed to start on +start_day+, default is
    # +Date.beginning_of_week+ or +config.beginning_of_week+ when set.
    def days_to_week_start(start_day = Date.beginning_of_week)
      start_day_number = DAYS_INTO_WEEK.fetch(start_day)
      (wday - start_day_number) % 7
    end

    # Returns a new date/time representing the start of this week on the given day.
    # Week is assumed to start on +start_day+, default is
    # +Date.beginning_of_week+ or +config.beginning_of_week+ when set.
    # +DateTime+ objects have their time set to 0:00.
    def beginning_of_week(start_day = Date.beginning_of_week)
      result = days_ago(days_to_week_start(start_day))
      acts_like?(:time) ? result.midnight : result
    end
    alias :at_beginning_of_week :beginning_of_week

    # Returns Monday of this week assuming that week starts on Monday.
    # +DateTime+ objects have their time set to 0:00.
    def monday
      beginning_of_week(:monday)
    end

    # Returns a new date/time representing the end of this week on the given day.
    # Week is assumed to start on +start_day+, default is
    # +Date.beginning_of_week+ or +config.beginning_of_week+ when set.
    # DateTime objects have their time set to 23:59:59.
    def end_of_week(start_day = Date.beginning_of_week)
      last_hour(days_since(6 - days_to_week_start(start_day)))
    end
    alias :at_end_of_week :end_of_week

    # Returns Sunday of this week assuming that week starts on Monday.
    # +DateTime+ objects have their time set to 23:59:59.
    def sunday
      end_of_week(:monday)
    end

    # Returns a new date/time representing the end of the month.
    # DateTime objects will have a time set to 23:59:59.
    def end_of_month
      last_day = ::Time.days_in_month(month, year)
      last_hour(days_since(last_day - day))
    end
    alias :at_end_of_month :end_of_month

    # Returns a new date/time representing the end of the year.
    # DateTime objects will have a time set to 23:59:59.
    def end_of_year
      change(month: 12).end_of_month
    end
    alias :at_end_of_year :end_of_year

    # Returns a Range representing the whole day of the current date/time.
    def all_day
      beginning_of_day..end_of_day
    end

    # Returns a Range representing the whole week of the current date/time.
    # Week starts on start_day, default is <tt>Date.beginning_of_week</tt> or <tt>config.beginning_of_week</tt> when set.
    def all_week(start_day = Date.beginning_of_week)
      beginning_of_week(start_day)..end_of_week(start_day)
    end

    # Returns a Range representing the whole month of the current date/time.
    def all_month
      beginning_of_month..end_of_month
    end

    # Returns a Range representing the whole quarter of the current date/time.
    def all_quarter
      beginning_of_quarter..end_of_quarter
    end

    # Returns a Range representing the whole year of the current date/time.
    def all_year
      beginning_of_year..end_of_year
    end

    # Returns a new date/time representing the next occurrence of the specified day of week.
    #
    #   today = Date.today               # => Thu, 14 Dec 2017
    #   today.next_occurring(:monday)    # => Mon, 18 Dec 2017
    #   today.next_occurring(:thursday)  # => Thu, 21 Dec 2017
    def next_occurring(day_of_week)
      from_now = DAYS_INTO_WEEK.fetch(day_of_week) - wday
      from_now += 7 unless from_now > 0
      advance(days: from_now)
    end

    # Returns a new date/time representing the previous occurrence of the specified day of week.
    #
    #   today = Date.today               # => Thu, 14 Dec 2017
    #   today.prev_occurring(:monday)    # => Mon, 11 Dec 2017
    #   today.prev_occurring(:thursday)  # => Thu, 07 Dec 2017
    def prev_occurring(day_of_week)
      ago = wday - DAYS_INTO_WEEK.fetch(day_of_week)
      ago += 7 unless ago > 0
      advance(days: -ago)
    end

    private
      def first_hour(date_or_time)
        date_or_time.acts_like?(:time) ? date_or_time.beginning_of_day : date_or_time
      end

      def last_hour(date_or_time)
        date_or_time.acts_like?(:time) ? date_or_time.end_of_day : date_or_time
      end

      def days_span(day)
        (DAYS_INTO_WEEK.fetch(day) - DAYS_INTO_WEEK.fetch(Date.beginning_of_week)) % 7
      end

      def copy_time_to(other)
        other.change(hour: hour, min: min, sec: sec, nsec: try(:nsec))
      end
  end
end
