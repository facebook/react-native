# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  # A time represented as an `Integer` number of seconds since 1970-01-01
  # 00:00:00 UTC (ignoring leap seconds and using the proleptic Gregorian
  # calendar), the fraction through the second (sub_second as a `Rational`) and
  # an optional UTC offset. Like Ruby's `Time` class, {Timestamp} can
  # distinguish between a local time with a zero offset and a time specified
  # explicitly as UTC.
  class Timestamp
    include Comparable

    # The Unix epoch (1970-01-01 00:00:00 UTC) as a chronological Julian day
    # number.
    JD_EPOCH = 2440588
    private_constant :JD_EPOCH

    class << self
      # Returns a new {Timestamp} representing the (proleptic Gregorian
      # calendar) date and time specified by the supplied parameters.
      #
      # If `utc_offset` is `nil`, `:utc` or 0, the date and time parameters will
      # be interpreted as representing a UTC date and time. Otherwise the date
      # and time parameters will be interpreted as a local date and time with
      # the given offset.
      #
      # @param year [Integer] the year.
      # @param month [Integer] the month (1-12).
      # @param day [Integer] the day of the month (1-31).
      # @param hour [Integer] the hour (0-23).
      # @param minute [Integer] the minute (0-59).
      # @param second [Integer] the second (0-59).
      # @param sub_second [Numeric] the fractional part of the second as either
      #   a `Rational` that is greater than or equal to 0 and less than 1, or
      #   the `Integer` 0.
      # @param utc_offset [Object] either `nil` for a {Timestamp} without a
      #   specified offset, an offset from UTC specified as an `Integer` number
      #   of seconds or the `Symbol` `:utc`).
      # @return [Timestamp] a new {Timestamp} representing the specified
      #   (proleptic Gregorian calendar) date and time.
      # @raise [ArgumentError] if either of `year`, `month`, `day`, `hour`,
      #   `minute`, or `second` is not an `Integer`.
      # @raise [ArgumentError] if `sub_second` is not a `Rational`, or the
      #   `Integer` 0.
      # @raise [ArgumentError] if `utc_offset` is not `nil`, not an `Integer`
      #   and not the `Symbol` `:utc`.
      # @raise [RangeError] if `month` is not between 1 and 12.
      # @raise [RangeError] if `day` is not between 1 and 31.
      # @raise [RangeError] if `hour` is not between 0 and 23.
      # @raise [RangeError] if `minute` is not between 0 and 59.
      # @raise [RangeError] if `second` is not between 0 and 59.
      # @raise [RangeError] if `sub_second` is a `Rational` but that is less
      #   than 0 or greater than or equal to 1.
      def create(year, month = 1, day = 1, hour = 0, minute = 0, second = 0, sub_second = 0, utc_offset = nil)
        raise ArgumentError, 'year must be an Integer' unless year.kind_of?(Integer)
        raise ArgumentError, 'month must be an Integer' unless month.kind_of?(Integer)
        raise ArgumentError, 'day must be an Integer' unless day.kind_of?(Integer)
        raise ArgumentError, 'hour must be an Integer' unless hour.kind_of?(Integer)
        raise ArgumentError, 'minute must be an Integer' unless minute.kind_of?(Integer)
        raise ArgumentError, 'second must be an Integer' unless second.kind_of?(Integer)
        raise RangeError, 'month must be between 1 and 12' if month < 1 || month > 12
        raise RangeError, 'day must be between 1 and 31' if day < 1 || day > 31
        raise RangeError, 'hour must be between 0 and 23' if hour < 0 || hour > 23
        raise RangeError, 'minute must be between 0 and 59' if minute < 0 || minute > 59
        raise RangeError, 'second must be between 0 and 59' if second < 0 || second > 59

        # Based on days_from_civil from https://howardhinnant.github.io/date_algorithms.html#days_from_civil
        after_february = month > 2
        year -= 1 unless after_february
        era = year / 400
        year_of_era = year - era * 400
        day_of_year = (153 * (month + (after_february ? -3 : 9)) + 2) / 5 + day - 1
        day_of_era = year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year
        days_since_epoch = era * 146097 + day_of_era - 719468
        value = ((days_since_epoch * 24 + hour) * 60 + minute) * 60 + second
        value -= utc_offset if utc_offset.kind_of?(Integer)

        new(value, sub_second, utc_offset)
      end

      # When used without a block, returns a {Timestamp} representation of a
      # given `Time`, `DateTime` or {Timestamp}.
      #
      # When called with a block, the {Timestamp} representation of `value` is
      # passed to the block. The block must then return a {Timestamp}, which
      # will be converted back to the type of the initial value. If the initial
      # value was a {Timestamp}, the block result will be returned. If the
      # initial value was a `DateTime`, a Gregorian `DateTime` will be returned.
      #
      # The UTC offset of `value` can either be preserved (the {Timestamp}
      # representation will have the same UTC offset as `value`), ignored (the
      # {Timestamp} representation will have no defined UTC offset), or treated
      # as though it were UTC (the {Timestamp} representation will have a
      # {utc_offset} of 0 and {utc?} will return `true`).
      #
      # @param value [Object] a `Time`, `DateTime` or {Timestamp}.
      # @param offset [Symbol] either `:preserve` to preserve the offset of
      #   `value`, `:ignore` to ignore the offset of `value` and create a
      #   {Timestamp} with an unspecified offset, or `:treat_as_utc` to treat
      #   the offset of `value` as though it were UTC and create a UTC
      #   {Timestamp}.
      # @yield [timestamp] if a block is provided, the {Timestamp}
      #   representation is passed to the block.
      # @yieldparam timestamp [Timestamp] the {Timestamp} representation of
      #   `value`.
      # @yieldreturn [Timestamp] a {Timestamp} to be converted back to the type
      #   of `value`.
      # @return [Object] if called without a block, the {Timestamp}
      #   representation of `value`, otherwise the result of the block,
      #   converted back to the type of `value`.
      def for(value, offset = :preserve)
        raise ArgumentError, 'value must be specified' unless value

        case offset
          when :ignore
            ignore_offset = true
            target_utc_offset = nil
          when :treat_as_utc
            ignore_offset = true
            target_utc_offset = :utc
          when :preserve
            ignore_offset = false
            target_utc_offset = nil
          else
            raise ArgumentError, 'offset must be :preserve, :ignore or :treat_as_utc'
        end

        time_like = false
        timestamp = case value
          when Time
            for_time(value, ignore_offset, target_utc_offset)
          when DateTime
            for_datetime(value, ignore_offset, target_utc_offset)
          when Timestamp
            for_timestamp(value, ignore_offset, target_utc_offset)
          else
            raise ArgumentError, "#{value.class} values are not supported" unless is_time_like?(value)
            time_like = true
            for_time_like(value, ignore_offset, target_utc_offset)
        end

        if block_given?
          result = yield timestamp
          raise ArgumentError, 'block must return a Timestamp' unless result.kind_of?(Timestamp)

          case value
            when Time
              result.to_time
            when DateTime
              result.to_datetime
            else # A Time-like value or a Timestamp
              time_like ? result.to_time : result
          end
        else
          timestamp
        end
      end

      # Creates a new UTC {Timestamp}.
      #
      # @param value [Integer] the number of seconds since 1970-01-01 00:00:00
      #   UTC ignoring leap seconds.
      # @param sub_second [Numeric] the fractional part of the second as either
      #   a `Rational` that is greater than or equal to 0 and less than 1, or
      #   the `Integer` 0.
      # @raise [ArgumentError] if `value` is not an `Integer`.
      # @raise [ArgumentError] if `sub_second` is not a `Rational`, or the
      #   `Integer` 0.
      # @raise [RangeError] if `sub_second` is a `Rational` but that is less
      #   than 0 or greater than or equal to 1.
      def utc(value, sub_second = 0)
        new(value, sub_second, :utc)
      end

      private

      # Constructs a new instance of `self` (i.e. {Timestamp} or a subclass of
      # {Timestamp}) without validating the parameters. This method is used
      # internally within {Timestamp} to avoid the overhead of checking
      # parameters.
      #
      # @param value [Integer] the number of seconds since 1970-01-01 00:00:00
      #   UTC ignoring leap seconds.
      # @param sub_second [Numeric] the fractional part of the second as either
      #   a `Rational` that is greater than or equal to 0 and less than 1, or
      #   the `Integer` 0.
      # @param utc_offset [Object] either `nil` for a {Timestamp} without a
      #   specified offset, an offset from UTC specified as an `Integer` number
      #   of seconds or the `Symbol` `:utc`).
      # @return [Timestamp] a new instance of `self`.
      def new!(value, sub_second = 0, utc_offset = nil)
        result = allocate
        result.send(:initialize!, value, sub_second, utc_offset)
        result
      end

      # Creates a {Timestamp} that represents a given `Time`, optionally
      # ignoring the offset.
      #
      # @param time [Time] a `Time`.
      # @param ignore_offset [Boolean] whether to ignore the offset of `time`.
      # @param target_utc_offset [Object] if `ignore_offset` is `true`, the UTC
      #   offset of the result (`:utc`, `nil` or an `Integer`).
      # @return [Timestamp] the {Timestamp} representation of `time`.
      def for_time(time, ignore_offset, target_utc_offset)
        value = time.to_i
        sub_second = time.subsec

        if ignore_offset
          utc_offset = target_utc_offset
          value += time.utc_offset
        elsif time.utc?
          utc_offset = :utc
        else
          utc_offset = time.utc_offset
        end

        new!(value, sub_second, utc_offset)
      end

      # Creates a {Timestamp} that represents a given `DateTime`, optionally
      # ignoring the offset.
      #
      # @param datetime [DateTime] a `DateTime`.
      # @param ignore_offset [Boolean] whether to ignore the offset of
      #   `datetime`.
      # @param target_utc_offset [Object] if `ignore_offset` is `true`, the UTC
      #   offset of the result (`:utc`, `nil` or an `Integer`).
      # @return [Timestamp] the {Timestamp} representation of `datetime`.
      def for_datetime(datetime, ignore_offset, target_utc_offset)
        value = (datetime.jd - JD_EPOCH) * 86400 + datetime.sec + datetime.min * 60 + datetime.hour * 3600
        sub_second = datetime.sec_fraction

        if ignore_offset
          utc_offset = target_utc_offset
        else
          utc_offset = (datetime.offset * 86400).to_i
          value -= utc_offset
        end

        new!(value, sub_second, utc_offset)
      end

      # Returns a {Timestamp} that represents another {Timestamp}, optionally
      # ignoring the offset. If the result would be identical to `value`, the
      # same instance is returned. If the passed in value is an instance of a
      # subclass of {Timestamp}, then a new {Timestamp} will always be returned.
      #
      # @param timestamp [Timestamp] a {Timestamp}.
      # @param ignore_offset [Boolean] whether to ignore the offset of
      #   `timestamp`.
      # @param target_utc_offset [Object] if `ignore_offset` is `true`, the UTC
      #   offset of the result (`:utc`, `nil` or an `Integer`).
      # @return [Timestamp] a [Timestamp] representation of `timestamp`.
      def for_timestamp(timestamp, ignore_offset, target_utc_offset)
        if ignore_offset
          if target_utc_offset
            unless target_utc_offset == :utc && timestamp.utc? || timestamp.utc_offset == target_utc_offset
              return new!(timestamp.value + (timestamp.utc_offset || 0), timestamp.sub_second, target_utc_offset)
            end
          elsif timestamp.utc_offset
            return new!(timestamp.value + timestamp.utc_offset, timestamp.sub_second)
          end
        end

        unless timestamp.instance_of?(Timestamp)
          # timestamp is identical in value, sub_second and utc_offset but is a
          # subclass (i.e. TimestampWithOffset). Return a new Timestamp
          # instance.
          return new!(timestamp.value, timestamp.sub_second, timestamp.utc? ? :utc : timestamp.utc_offset)
        end

        timestamp
      end

      # Determines if an object is like a `Time` (for the purposes of converting
      # to a {Timestamp} with {for}), responding to `to_i` and `subsec`.
      #
      # @param value [Object] an object to test.
      # @return [Boolean] `true` if the object is `Time`-like, otherwise
      #   `false`.
      def is_time_like?(value)
        value.respond_to?(:to_i) && value.respond_to?(:subsec)
      end

      # Creates a {Timestamp} that represents a given `Time`-like object,
      # optionally ignoring the offset (if the `time_like` responds to
      # `utc_offset`).
      #
      # @param time_like [Object] a `Time`-like object.
      # @param ignore_offset [Boolean] whether to ignore the offset of `time`.
      # @param target_utc_offset [Object] if `ignore_offset` is `true`, the UTC
      #   offset of the result (`:utc`, `nil` or an `Integer`).
      # @return [Timestamp] the {Timestamp} representation of `time_like`.
      def for_time_like(time_like, ignore_offset, target_utc_offset)
        value = time_like.to_i
        sub_second = time_like.subsec.to_r

        if ignore_offset
          utc_offset = target_utc_offset
          value += time_like.utc_offset.to_i if time_like.respond_to?(:utc_offset)
        elsif time_like.respond_to?(:utc_offset)
          utc_offset = time_like.utc_offset.to_i
        else
          utc_offset = 0
        end

        new(value, sub_second, utc_offset)
      end
    end

    # @return [Integer] the number of seconds since 1970-01-01 00:00:00 UTC
    #   ignoring leap seconds (i.e. each day is treated as if it were 86,400
    #   seconds long).
    attr_reader :value

    # @return [Numeric] the fraction of a second elapsed since timestamp as
    #   either a `Rational` or the `Integer` 0. Always greater than or equal to
    #   0 and less than 1.
    attr_reader :sub_second

    # @return [Integer] the offset from UTC in seconds or `nil` if the
    #   {Timestamp} doesn't have a specified offset.
    attr_reader :utc_offset

    # Initializes a new {Timestamp}.
    #
    # @param value [Integer] the number of seconds since 1970-01-01 00:00:00 UTC
    #   ignoring leap seconds.
    # @param sub_second [Numeric] the fractional part of the second as either a
    #   `Rational` that is greater than or equal to 0 and less than 1, or
    #   the `Integer` 0.
    # @param utc_offset [Object] either `nil` for a {Timestamp} without a
    #   specified offset, an offset from UTC specified as an `Integer` number of
    #   seconds or the `Symbol` `:utc`).
    # @raise [ArgumentError] if `value` is not an `Integer`.
    # @raise [ArgumentError] if `sub_second` is not a `Rational`, or the
    #   `Integer` 0.
    # @raise [RangeError] if `sub_second` is a `Rational` but that is less
    #   than 0 or greater than or equal to 1.
    # @raise [ArgumentError] if `utc_offset` is not `nil`, not an `Integer` and
    #   not the `Symbol` `:utc`.
    def initialize(value, sub_second = 0, utc_offset = nil)
      raise ArgumentError, 'value must be an Integer' unless value.kind_of?(Integer)
      raise ArgumentError, 'sub_second must be a Rational or the Integer 0' unless (sub_second.kind_of?(Integer) && sub_second == 0) || sub_second.kind_of?(Rational)
      raise RangeError, 'sub_second must be >= 0 and < 1' if sub_second < 0 || sub_second >= 1
      raise ArgumentError, 'utc_offset must be an Integer, :utc or nil' if utc_offset && utc_offset != :utc && !utc_offset.kind_of?(Integer)
      initialize!(value, sub_second, utc_offset)
    end

    # @return [Boolean] `true` if this {Timestamp} represents UTC, `false` if
    #   the {Timestamp} wasn't specified as UTC or `nil` if the {Timestamp} has
    #   no specified offset.
    def utc?
      @utc
    end

    # Adds a number of seconds to the {Timestamp} value, setting the UTC offset
    # of the result.
    #
    # @param seconds [Integer] the number of seconds to be added.
    # @param utc_offset [Object] either `nil` for a {Timestamp} without a
    #   specified offset, an offset from UTC specified as an `Integer` number of
    #   seconds or the `Symbol` `:utc`).
    # @return [Timestamp] the result of adding `seconds` to the
    #   {Timestamp} value as a new {Timestamp} instance with the chosen
    #   `utc_offset`.
    # @raise [ArgumentError] if `seconds` is not an `Integer`.
    # @raise [ArgumentError] if `utc_offset` is not `nil`, not an `Integer` and
    #   not the `Symbol` `:utc`.
    def add_and_set_utc_offset(seconds, utc_offset)
      raise ArgumentError, 'seconds must be an Integer' unless seconds.kind_of?(Integer)
      raise ArgumentError, 'utc_offset must be an Integer, :utc or nil' if utc_offset && utc_offset != :utc && !utc_offset.kind_of?(Integer)
      return self if seconds == 0 && utc_offset == (@utc ? :utc : @utc_offset)
      Timestamp.send(:new!, @value + seconds, @sub_second, utc_offset)
    end

    # @return [Timestamp] a UTC {Timestamp} equivalent to this instance. Returns
    #   `self` if {#utc? self.utc?} is `true`.
    def utc
      return self if @utc
      Timestamp.send(:new!, @value, @sub_second, :utc)
    end

    # Converts this {Timestamp} to a `Time`.
    #
    # @return [Time] a `Time` representation of this {Timestamp}. If the UTC
    #   offset of this {Timestamp} is not specified, a UTC `Time` will be
    #   returned.
    def to_time
      time = new_time

      if @utc_offset && !@utc
        time.localtime(@utc_offset)
      else
        time.utc
      end
    end

    # Converts this {Timestamp} to a Gregorian `DateTime`.
    #
    # @return [DateTime] a Gregorian `DateTime` representation of this
    #   {Timestamp}. If the UTC offset of this {Timestamp} is not specified, a
    #   UTC `DateTime` will be returned.
    def to_datetime
      new_datetime
    end

    # Converts this {Timestamp} to an `Integer` number of seconds since
    # 1970-01-01 00:00:00 UTC (ignoring leap seconds).
    #
    # @return [Integer] an `Integer` representation of this {Timestamp} (the
    #   number of seconds since 1970-01-01 00:00:00 UTC ignoring leap seconds).
    def to_i
      value
    end

    # Formats this {Timestamp} according to the directives in the given format
    # string.
    #
    # @param format [String] the format string. Please refer to `Time#strftime`
    #   for a list of supported format directives.
    # @return [String] the formatted {Timestamp}.
    # @raise [ArgumentError] if `format` is not specified.
    def strftime(format)
      raise ArgumentError, 'format must be specified' unless format
      to_time.strftime(format)
    end

    # @return [String] a `String` representation of this {Timestamp}.
    def to_s
      return value_and_sub_second_to_s unless @utc_offset
      return "#{value_and_sub_second_to_s} UTC" if @utc

      sign = @utc_offset >= 0 ? '+' : '-'
      min, sec = @utc_offset.abs.divmod(60)
      hour, min = min.divmod(60)

      "#{value_and_sub_second_to_s(@utc_offset)} #{sign}#{'%02d' % hour}:#{'%02d' % min}#{sec > 0 ? ':%02d' % sec : nil}#{@utc_offset != 0 ? " (#{value_and_sub_second_to_s} UTC)" : nil}"
    end

    # Compares this {Timestamp} with another.
    #
    # {Timestamp} instances without a defined UTC offset are not comparable with
    # {Timestamp} instances that have a defined UTC offset.
    #
    # @param t [Timestamp] the {Timestamp} to compare this instance with.
    # @return [Integer] -1, 0 or 1 depending if this instance is earlier, equal
    #   or later than `t` respectively. Returns `nil` when comparing a
    #   {Timestamp} that does not have a defined UTC offset with a {Timestamp}
    #   that does have a defined UTC offset. Returns `nil` if `t` is not a
    #   {Timestamp}.
    def <=>(t)
      return nil unless t.kind_of?(Timestamp)
      return nil if utc_offset && !t.utc_offset
      return nil if !utc_offset && t.utc_offset

      result = value <=> t.value
      result = sub_second <=> t.sub_second if result == 0
      result
    end

    alias eql? ==

    # @return [Integer] a hash based on the value, sub-second and whether there
    #   is a defined UTC offset.
    def hash
      [@value, @sub_second, !!@utc_offset].hash
    end

    # @return [String] the internal object state as a programmer-readable
    #   `String`.
    def inspect
      "#<#{self.class}: @value=#{@value}, @sub_second=#{@sub_second}, @utc_offset=#{@utc_offset.inspect}, @utc=#{@utc.inspect}>"
    end

    protected

    # Creates a new instance of a `Time` or `Time`-like class matching the
    # {value} and {sub_second} of this {Timestamp}, but not setting the offset.
    #
    # @param klass [Class] the class to instantiate.
    #
    # @private
    def new_time(klass = Time)
      klass.at(@value, @sub_second * 1_000_000)
    end

    # Constructs a new instance of a `DateTime` or `DateTime`-like class with
    # the same {value}, {sub_second} and {utc_offset} as this {Timestamp}.
    #
    # @param klass [Class] the class to instantiate.
    #
    # @private
    def new_datetime(klass = DateTime)
      # Can't specify the start parameter unless the jd parameter is an exact number of days.
      # Use #gregorian instead.
      datetime = klass.jd(JD_EPOCH + ((@value.to_r + @sub_second) / 86400)).gregorian
      @utc_offset && @utc_offset != 0 ? datetime.new_offset(Rational(@utc_offset, 86400)) : datetime
    end

    private

    # Converts the value and sub-seconds to a `String`, adding on the given
    # offset.
    #
    # @param offset [Integer] the offset to add to the value.
    # @return [String] the value and sub-seconds.
    def value_and_sub_second_to_s(offset = 0)
      "#{@value + offset}#{sub_second_to_s}"
    end

    # Converts the {sub_second} value to a `String` suitable for appending to
    # the `String` representation of a {Timestamp}.
    #
    # @return [String] a `String` representation of {sub_second}.
    def sub_second_to_s
      if @sub_second == 0
        ''
      else
        " #{@sub_second.numerator}/#{@sub_second.denominator}"
      end
    end

    # Initializes a new {Timestamp} without validating the parameters. This
    # method is used internally within {Timestamp} to avoid the overhead of
    # checking parameters.
    #
    # @param value [Integer] the number of seconds since 1970-01-01 00:00:00 UTC
    #   ignoring leap seconds.
    # @param sub_second [Numeric] the fractional part of the second as either a
    #   `Rational` that is greater than or equal to 0 and less than 1, or the
    #   `Integer` 0.
    # @param utc_offset [Object] either `nil` for a {Timestamp} without a
    #   specified offset, an offset from UTC specified as an `Integer` number of
    #   seconds or the `Symbol` `:utc`).
    def initialize!(value, sub_second = 0, utc_offset = nil)
      @value = value

      # Convert Rational(0,1) to 0.
      @sub_second = sub_second == 0 ? 0 : sub_second

      if utc_offset
        @utc = utc_offset == :utc
        @utc_offset = @utc ? 0 : utc_offset
      else
        @utc = @utc_offset = nil
      end
    end
  end
end
