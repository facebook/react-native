# frozen_string_literal: true

require "active_support/core_ext/object/blank"

module ActiveSupport
  class Duration
    # Serializes duration to string according to ISO 8601 Duration format.
    class ISO8601Serializer # :nodoc:
      DATE_COMPONENTS = %i(years months days)

      def initialize(duration, precision: nil)
        @duration = duration
        @precision = precision
      end

      # Builds and returns output string.
      def serialize
        parts = normalize
        return "PT0S" if parts.empty?

        output = +"P"
        output << "#{parts[:years]}Y"   if parts.key?(:years)
        output << "#{parts[:months]}M"  if parts.key?(:months)
        output << "#{parts[:days]}D"    if parts.key?(:days)
        output << "#{parts[:weeks]}W"   if parts.key?(:weeks)
        time = +""
        time << "#{parts[:hours]}H"     if parts.key?(:hours)
        time << "#{parts[:minutes]}M"   if parts.key?(:minutes)
        if parts.key?(:seconds)
          time << "#{format_seconds(parts[:seconds])}S"
        end
        output << "T#{time}" unless time.empty?
        output
      end

      private
        # Return pair of duration's parts and whole duration sign.
        # Parts are summarized (as they can become repetitive due to addition, etc).
        # Zero parts are removed as not significant.
        # If all parts are negative it will negate all of them and return minus as a sign.
        def normalize
          parts = @duration.parts.each_with_object(Hash.new(0)) do |(k, v), p|
            p[k] += v  unless v.zero?
          end

          # Convert weeks to days and remove weeks if mixed with date parts
          if week_mixed_with_date?(parts)
            parts[:days] += parts.delete(:weeks) * SECONDS_PER_WEEK / SECONDS_PER_DAY
          end

          parts
        end

        def week_mixed_with_date?(parts)
          parts.key?(:weeks) && (parts.keys & DATE_COMPONENTS).any?
        end

        def format_seconds(seconds)
          if @precision
            sprintf("%0.0#{@precision}f", seconds)
          else
            seconds.to_s
          end
        end
    end
  end
end
