# encoding: UTF-8
# frozen_string_literal: true

require 'strscan'

module TZInfo
  module DataSources
    # An {InvalidPosixTimeZone} exception is raised if an invalid POSIX-style
    # time zone string is encountered.
    #
    # @private
    class InvalidPosixTimeZone < StandardError #:nodoc:
    end
    private_constant :InvalidPosixTimeZone

    # A parser for POSIX-style TZ strings used in zoneinfo files and specified
    # by tzfile.5 and tzset.3.
    #
    # @private
    class PosixTimeZoneParser #:nodoc:
      # Initializes a new {PosixTimeZoneParser}.
      #
      # @param string_deduper [StringDeduper] a {StringDeduper} instance to use
      #   to dedupe abbreviations.
      def initialize(string_deduper)
        @string_deduper = string_deduper
      end

      # Parses a POSIX-style TZ string.
      #
      # @param tz_string [String] the string to parse.
      # @return [Object] either a {TimezoneOffset} for a constantly applied
      #   offset or an {AnnualRules} instance representing the rules.
      # @raise [InvalidPosixTimeZone] if `tz_string` is not a `String`.
      # @raise [InvalidPosixTimeZone] if `tz_string` is is not valid.
      def parse(tz_string)
        raise InvalidPosixTimeZone unless tz_string.kind_of?(String)
        return nil if tz_string.empty?

        s = StringScanner.new(tz_string)
        check_scan(s, /([^-+,\d<][^-+,\d]*) | <([^>]+)>/x)
        std_abbrev = @string_deduper.dedupe(RubyCoreSupport.untaint(s[1] || s[2]))
        check_scan(s, /([-+]?\d+)(?::(\d+)(?::(\d+))?)?/)
        std_offset = get_offset_from_hms(s[1], s[2], s[3])

        if s.scan(/([^-+,\d<][^-+,\d]*) | <([^>]+)>/x)
          dst_abbrev = @string_deduper.dedupe(RubyCoreSupport.untaint(s[1] || s[2]))

          if s.scan(/([-+]?\d+)(?::(\d+)(?::(\d+))?)?/)
            dst_offset = get_offset_from_hms(s[1], s[2], s[3])
          else
            # POSIX is negative for ahead of UTC.
            dst_offset = std_offset - 3600
          end

          dst_difference = std_offset - dst_offset

          start_rule = parse_rule(s, 'start')
          end_rule = parse_rule(s, 'end')

          raise InvalidPosixTimeZone, "Expected the end of a POSIX-style time zone string but found '#{s.rest}'." if s.rest?

          if start_rule.is_always_first_day_of_year? && start_rule.transition_at == 0 &&
               end_rule.is_always_last_day_of_year? && end_rule.transition_at == 86400 + dst_difference
            # Constant daylight savings time.
            # POSIX is negative for ahead of UTC.
            TimezoneOffset.new(-std_offset, dst_difference, dst_abbrev)
          else
            AnnualRules.new(
              TimezoneOffset.new(-std_offset, 0, std_abbrev),
              TimezoneOffset.new(-std_offset, dst_difference, dst_abbrev),
              start_rule,
              end_rule)
          end
        elsif !s.rest?
          # Constant standard time.
          # POSIX is negative for ahead of UTC.
          TimezoneOffset.new(-std_offset, 0, std_abbrev)
        else
          raise InvalidPosixTimeZone, "Expected the end of a POSIX-style time zone string but found '#{s.rest}'."
        end
      end

      private

      # Parses a rule.
      #
      # @param s [StringScanner] the `StringScanner` to read the rule from.
      # @param type [String] the type of rule (either `'start'` or `'end'`).
      # @raise [InvalidPosixTimeZone] if the rule is not valid.
      # @return [TransitionRule] the parsed rule.
      def parse_rule(s, type)
        check_scan(s, /,(?: (?: J(\d+) ) | (\d+) | (?: M(\d+)\.(\d)\.(\d) ) )/x)
        julian_day_of_year = s[1]
        absolute_day_of_year = s[2]
        month = s[3]
        week = s[4]
        day_of_week = s[5]

        if s.scan(/\//)
          check_scan(s, /([-+]?\d+)(?::(\d+)(?::(\d+))?)?/)
          transition_at = get_seconds_after_midnight_from_hms(s[1], s[2], s[3])
        else
          transition_at = 7200
        end

        begin
          if julian_day_of_year
            JulianDayOfYearTransitionRule.new(julian_day_of_year.to_i, transition_at)
          elsif absolute_day_of_year
            AbsoluteDayOfYearTransitionRule.new(absolute_day_of_year.to_i, transition_at)
          elsif week == '5'
            LastDayOfMonthTransitionRule.new(month.to_i, day_of_week.to_i, transition_at)
          else
            DayOfMonthTransitionRule.new(month.to_i, week.to_i, day_of_week.to_i, transition_at)
          end
        rescue ArgumentError => e
          raise InvalidPosixTimeZone, "Invalid #{type} rule in POSIX-style time zone string: #{e}"
        end
      end

      # Returns an offset in seconds from hh:mm:ss values. The value can be
      # negative. -02:33:12 would represent 2 hours, 33 minutes and 12 seconds
      # ahead of UTC.
      #
      # @param h [String] the hours.
      # @param m [String] the minutes.
      # @param s [String] the seconds.
      # @return [Integer] the offset.
      # @raise [InvalidPosixTimeZone] if the mm and ss values are greater than
      #   59.
      def get_offset_from_hms(h, m, s)
        h = h.to_i
        m = m.to_i
        s = s.to_i
        raise InvalidPosixTimeZone, "Invalid minute #{m} in offset for POSIX-style time zone string." if m > 59
        raise InvalidPosixTimeZone, "Invalid second #{s} in offset for POSIX-style time zone string." if s > 59
        magnitude = (h.abs * 60 + m) * 60 + s
        h < 0 ? -magnitude : magnitude
      end

      # Returns the seconds from midnight from hh:mm:ss values. Hours can exceed
      # 24 for a time on the following day. Hours can be negative to subtract
      # hours from midnight on the given day. -02:33:12 represents 22:33:12 on
      # the prior day.
      #
      # @param h [String] the hour.
      # @param m [String] the minutes past the hour.
      # @param s [String] the seconds past the minute.
      # @return [Integer] the number of seconds after midnight.
      # @raise [InvalidPosixTimeZone] if the mm and ss values are greater than
      #   59.
      def get_seconds_after_midnight_from_hms(h, m, s)
        h = h.to_i
        m = m.to_i
        s = s.to_i
        raise InvalidPosixTimeZone, "Invalid minute #{m} in time for POSIX-style time zone string." if m > 59
        raise InvalidPosixTimeZone, "Invalid second #{s} in time for POSIX-style time zone string." if s > 59
        (h * 3600) + m * 60 + s
      end

      # Scans for a pattern and raises an exception if the pattern does not
      # match the input.
      #
      # @param s [StringScanner] the `StringScanner` to scan.
      # @param pattern [Regexp] the pattern to match.
      # @return [String] the result of the scan.
      # @raise [InvalidPosixTimeZone] if the pattern does not match the input.
      def check_scan(s, pattern)
        result = s.scan(pattern)
        raise InvalidPosixTimeZone, "Expected '#{s.rest}' to match #{pattern} in POSIX-style time zone string." unless result
        result
      end
    end
    private_constant :PosixTimeZoneParser
  end
end
