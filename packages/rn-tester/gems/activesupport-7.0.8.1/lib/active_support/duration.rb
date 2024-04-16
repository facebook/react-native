# frozen_string_literal: true

require "active_support/core_ext/array/conversions"
require "active_support/core_ext/module/delegation"
require "active_support/core_ext/object/acts_like"
require "active_support/core_ext/string/filters"

module ActiveSupport
  # Provides accurate date and time measurements using Date#advance and
  # Time#advance, respectively. It mainly supports the methods on Numeric.
  #
  #   1.month.ago       # equivalent to Time.now.advance(months: -1)
  class Duration
    class Scalar < Numeric # :nodoc:
      attr_reader :value
      delegate :to_i, :to_f, :to_s, to: :value

      def initialize(value)
        @value = value
      end

      def coerce(other)
        [Scalar.new(other), self]
      end

      def -@
        Scalar.new(-value)
      end

      def <=>(other)
        if Scalar === other || Duration === other
          value <=> other.value
        elsif Numeric === other
          value <=> other
        else
          nil
        end
      end

      def +(other)
        if Duration === other
          seconds   = value + other._parts.fetch(:seconds, 0)
          new_parts = other._parts.merge(seconds: seconds)
          new_value = value + other.value

          Duration.new(new_value, new_parts, other.variable?)
        else
          calculate(:+, other)
        end
      end

      def -(other)
        if Duration === other
          seconds   = value - other._parts.fetch(:seconds, 0)
          new_parts = other._parts.transform_values(&:-@)
          new_parts = new_parts.merge(seconds: seconds)
          new_value = value - other.value

          Duration.new(new_value, new_parts, other.variable?)
        else
          calculate(:-, other)
        end
      end

      def *(other)
        if Duration === other
          new_parts = other._parts.transform_values { |other_value| value * other_value }
          new_value = value * other.value

          Duration.new(new_value, new_parts, other.variable?)
        else
          calculate(:*, other)
        end
      end

      def /(other)
        if Duration === other
          value / other.value
        else
          calculate(:/, other)
        end
      end

      def %(other)
        if Duration === other
          Duration.build(value % other.value)
        else
          calculate(:%, other)
        end
      end

      def variable? # :nodoc:
        false
      end

      private
        def calculate(op, other)
          if Scalar === other
            Scalar.new(value.public_send(op, other.value))
          elsif Numeric === other
            Scalar.new(value.public_send(op, other))
          else
            raise_type_error(other)
          end
        end

        def raise_type_error(other)
          raise TypeError, "no implicit conversion of #{other.class} into #{self.class}"
        end
    end

    SECONDS_PER_MINUTE = 60
    SECONDS_PER_HOUR   = 3600
    SECONDS_PER_DAY    = 86400
    SECONDS_PER_WEEK   = 604800
    SECONDS_PER_MONTH  = 2629746  # 1/12 of a gregorian year
    SECONDS_PER_YEAR   = 31556952 # length of a gregorian year (365.2425 days)

    PARTS_IN_SECONDS = {
      seconds: 1,
      minutes: SECONDS_PER_MINUTE,
      hours:   SECONDS_PER_HOUR,
      days:    SECONDS_PER_DAY,
      weeks:   SECONDS_PER_WEEK,
      months:  SECONDS_PER_MONTH,
      years:   SECONDS_PER_YEAR
    }.freeze

    PARTS = [:years, :months, :weeks, :days, :hours, :minutes, :seconds].freeze
    VARIABLE_PARTS = [:years, :months, :weeks, :days].freeze

    attr_reader :value

    autoload :ISO8601Parser,     "active_support/duration/iso8601_parser"
    autoload :ISO8601Serializer, "active_support/duration/iso8601_serializer"

    class << self
      # Creates a new Duration from string formatted according to ISO 8601 Duration.
      #
      # See {ISO 8601}[https://en.wikipedia.org/wiki/ISO_8601#Durations] for more information.
      # This method allows negative parts to be present in pattern.
      # If invalid string is provided, it will raise +ActiveSupport::Duration::ISO8601Parser::ParsingError+.
      def parse(iso8601duration)
        parts = ISO8601Parser.new(iso8601duration).parse!
        new(calculate_total_seconds(parts), parts)
      end

      def ===(other) # :nodoc:
        other.is_a?(Duration)
      rescue ::NoMethodError
        false
      end

      def seconds(value) # :nodoc:
        new(value, { seconds: value }, false)
      end

      def minutes(value) # :nodoc:
        new(value * SECONDS_PER_MINUTE, { minutes: value }, false)
      end

      def hours(value) # :nodoc:
        new(value * SECONDS_PER_HOUR, { hours: value }, false)
      end

      def days(value) # :nodoc:
        new(value * SECONDS_PER_DAY, { days: value }, true)
      end

      def weeks(value) # :nodoc:
        new(value * SECONDS_PER_WEEK, { weeks: value }, true)
      end

      def months(value) # :nodoc:
        new(value * SECONDS_PER_MONTH, { months: value }, true)
      end

      def years(value) # :nodoc:
        new(value * SECONDS_PER_YEAR, { years: value }, true)
      end

      # Creates a new Duration from a seconds value that is converted
      # to the individual parts:
      #
      #   ActiveSupport::Duration.build(31556952).parts # => {:years=>1}
      #   ActiveSupport::Duration.build(2716146).parts  # => {:months=>1, :days=>1}
      #
      def build(value)
        unless value.is_a?(::Numeric)
          raise TypeError, "can't build an #{self.name} from a #{value.class.name}"
        end

        parts = {}
        remainder_sign = value <=> 0
        remainder = value.round(9).abs
        variable = false

        PARTS.each do |part|
          unless part == :seconds
            part_in_seconds = PARTS_IN_SECONDS[part]
            parts[part] = remainder.div(part_in_seconds) * remainder_sign
            remainder %= part_in_seconds

            unless parts[part].zero?
              variable ||= VARIABLE_PARTS.include?(part)
            end
          end
        end unless value == 0

        parts[:seconds] = remainder * remainder_sign

        new(value, parts, variable)
      end

      private
        def calculate_total_seconds(parts)
          parts.inject(0) do |total, (part, value)|
            total + value * PARTS_IN_SECONDS[part]
          end
        end
    end

    def initialize(value, parts, variable = nil) # :nodoc:
      @value, @parts = value, parts
      @parts.reject! { |k, v| v.zero? } unless value == 0
      @parts.freeze
      @variable = variable

      if @variable.nil?
        @variable = @parts.any? { |part, _| VARIABLE_PARTS.include?(part) }
      end
    end

    # Returns a copy of the parts hash that defines the duration
    def parts
      @parts.dup
    end

    def coerce(other) # :nodoc:
      case other
      when Scalar
        [other, self]
      when Duration
        [Scalar.new(other.value), self]
      else
        [Scalar.new(other), self]
      end
    end

    # Compares one Duration with another or a Numeric to this Duration.
    # Numeric values are treated as seconds.
    def <=>(other)
      if Duration === other
        value <=> other.value
      elsif Numeric === other
        value <=> other
      end
    end

    # Adds another Duration or a Numeric to this Duration. Numeric values
    # are treated as seconds.
    def +(other)
      if Duration === other
        parts = @parts.merge(other._parts) do |_key, value, other_value|
          value + other_value
        end
        Duration.new(value + other.value, parts, @variable || other.variable?)
      else
        seconds = @parts.fetch(:seconds, 0) + other
        Duration.new(value + other, @parts.merge(seconds: seconds), @variable)
      end
    end

    # Subtracts another Duration or a Numeric from this Duration. Numeric
    # values are treated as seconds.
    def -(other)
      self + (-other)
    end

    # Multiplies this Duration by a Numeric and returns a new Duration.
    def *(other)
      if Scalar === other || Duration === other
        Duration.new(value * other.value, @parts.transform_values { |number| number * other.value }, @variable || other.variable?)
      elsif Numeric === other
        Duration.new(value * other, @parts.transform_values { |number| number * other }, @variable)
      else
        raise_type_error(other)
      end
    end

    # Divides this Duration by a Numeric and returns a new Duration.
    def /(other)
      if Scalar === other
        Duration.new(value / other.value, @parts.transform_values { |number| number / other.value }, @variable)
      elsif Duration === other
        value / other.value
      elsif Numeric === other
        Duration.new(value / other, @parts.transform_values { |number| number / other }, @variable)
      else
        raise_type_error(other)
      end
    end

    # Returns the modulo of this Duration by another Duration or Numeric.
    # Numeric values are treated as seconds.
    def %(other)
      if Duration === other || Scalar === other
        Duration.build(value % other.value)
      elsif Numeric === other
        Duration.build(value % other)
      else
        raise_type_error(other)
      end
    end

    def -@ # :nodoc:
      Duration.new(-value, @parts.transform_values(&:-@), @variable)
    end

    def +@ # :nodoc:
      self
    end

    def is_a?(klass) # :nodoc:
      Duration == klass || value.is_a?(klass)
    end
    alias :kind_of? :is_a?

    def instance_of?(klass) # :nodoc:
      Duration == klass || value.instance_of?(klass)
    end

    # Returns +true+ if +other+ is also a Duration instance with the
    # same +value+, or if <tt>other == value</tt>.
    def ==(other)
      if Duration === other
        other.value == value
      else
        other == value
      end
    end

    # Returns the amount of seconds a duration covers as a string.
    # For more information check to_i method.
    #
    #   1.day.to_s # => "86400"
    def to_s
      @value.to_s
    end

    # Returns the number of seconds that this Duration represents.
    #
    #   1.minute.to_i   # => 60
    #   1.hour.to_i     # => 3600
    #   1.day.to_i      # => 86400
    #
    # Note that this conversion makes some assumptions about the
    # duration of some periods, e.g. months are always 1/12 of year
    # and years are 365.2425 days:
    #
    #   # equivalent to (1.year / 12).to_i
    #   1.month.to_i    # => 2629746
    #
    #   # equivalent to 365.2425.days.to_i
    #   1.year.to_i     # => 31556952
    #
    # In such cases, Ruby's core
    # Date[https://ruby-doc.org/stdlib/libdoc/date/rdoc/Date.html] and
    # Time[https://ruby-doc.org/stdlib/libdoc/time/rdoc/Time.html] should be used for precision
    # date and time arithmetic.
    def to_i
      @value.to_i
    end
    alias :in_seconds :to_i

    # Returns the amount of minutes a duration covers as a float
    #
    #   1.day.in_minutes # => 1440.0
    def in_minutes
      in_seconds / SECONDS_PER_MINUTE.to_f
    end

    # Returns the amount of hours a duration covers as a float
    #
    #   1.day.in_hours # => 24.0
    def in_hours
      in_seconds / SECONDS_PER_HOUR.to_f
    end

    # Returns the amount of days a duration covers as a float
    #
    #   12.hours.in_days # => 0.5
    def in_days
      in_seconds / SECONDS_PER_DAY.to_f
    end

    # Returns the amount of weeks a duration covers as a float
    #
    #   2.months.in_weeks # => 8.696
    def in_weeks
      in_seconds / SECONDS_PER_WEEK.to_f
    end

    # Returns the amount of months a duration covers as a float
    #
    #   9.weeks.in_months # => 2.07
    def in_months
      in_seconds / SECONDS_PER_MONTH.to_f
    end

    # Returns the amount of years a duration covers as a float
    #
    #   30.days.in_years # => 0.082
    def in_years
      in_seconds / SECONDS_PER_YEAR.to_f
    end

    # Returns +true+ if +other+ is also a Duration instance, which has the
    # same parts as this one.
    def eql?(other)
      Duration === other && other.value.eql?(value)
    end

    def hash
      @value.hash
    end

    # Calculates a new Time or Date that is as far in the future
    # as this Duration represents.
    def since(time = ::Time.current)
      sum(1, time)
    end
    alias :from_now :since
    alias :after :since

    # Calculates a new Time or Date that is as far in the past
    # as this Duration represents.
    def ago(time = ::Time.current)
      sum(-1, time)
    end
    alias :until :ago
    alias :before :ago

    def inspect # :nodoc:
      return "#{value} seconds" if @parts.empty?

      @parts.
        sort_by { |unit,  _ | PARTS.index(unit) }.
        map     { |unit, val| "#{val} #{val == 1 ? unit.to_s.chop : unit.to_s}" }.
        to_sentence(locale: false)
    end

    def as_json(options = nil) # :nodoc:
      to_i
    end

    def init_with(coder) # :nodoc:
      initialize(coder["value"], coder["parts"])
    end

    def encode_with(coder) # :nodoc:
      coder.map = { "value" => @value, "parts" => @parts }
    end

    # Build ISO 8601 Duration string for this duration.
    # The +precision+ parameter can be used to limit seconds' precision of duration.
    def iso8601(precision: nil)
      ISO8601Serializer.new(self, precision: precision).serialize
    end

    def variable? # :nodoc:
      @variable
    end

    def _parts # :nodoc:
      @parts
    end

    private
      def sum(sign, time = ::Time.current)
        unless time.acts_like?(:time) || time.acts_like?(:date)
          raise ::ArgumentError, "expected a time or date, got #{time.inspect}"
        end

        if @parts.empty?
          time.since(sign * value)
        else
          @parts.inject(time) do |t, (type, number)|
            if type == :seconds
              t.since(sign * number)
            elsif type == :minutes
              t.since(sign * number * 60)
            elsif type == :hours
              t.since(sign * number * 3600)
            else
              t.advance(type => sign * number)
            end
          end
        end
      end

      def respond_to_missing?(method, _)
        value.respond_to?(method)
      end

      def method_missing(method, *args, &block)
        value.public_send(method, *args, &block)
      end

      def raise_type_error(other)
        raise TypeError, "no implicit conversion of #{other.class} into #{self.class}"
      end
  end
end
