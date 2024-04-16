# frozen_string_literal: true

require "active_support/core_ext/module/attribute_accessors"
require "active_support/core_ext/module/delegation"
require "json"

module ActiveSupport
  # Look for and parse json strings that look like ISO 8601 times.
  mattr_accessor :parse_json_times

  module JSON
    # matches YAML-formatted dates
    DATE_REGEX = /\A\d{4}-\d{2}-\d{2}\z/
    DATETIME_REGEX = /\A(?:\d{4}-\d{2}-\d{2}|\d{4}-\d{1,2}-\d{1,2}[T \t]+\d{1,2}:\d{2}:\d{2}(\.[0-9]*)?(([ \t]*)Z|[-+]\d{2}?(:\d{2})?)?)\z/

    class << self
      # Parses a JSON string (JavaScript Object Notation) into a hash.
      # See http://www.json.org for more info.
      #
      #   ActiveSupport::JSON.decode("{\"team\":\"rails\",\"players\":\"36\"}")
      #   => {"team" => "rails", "players" => "36"}
      def decode(json)
        data = ::JSON.parse(json, quirks_mode: true)

        if ActiveSupport.parse_json_times
          convert_dates_from(data)
        else
          data
        end
      end

      # Returns the class of the error that will be raised when there is an
      # error in decoding JSON. Using this method means you won't directly
      # depend on the ActiveSupport's JSON implementation, in case it changes
      # in the future.
      #
      #   begin
      #     obj = ActiveSupport::JSON.decode(some_string)
      #   rescue ActiveSupport::JSON.parse_error
      #     Rails.logger.warn("Attempted to decode invalid JSON: #{some_string}")
      #   end
      def parse_error
        ::JSON::ParserError
      end

      private
        def convert_dates_from(data)
          case data
          when nil
            nil
          when DATE_REGEX
            begin
              Date.parse(data)
            rescue ArgumentError
              data
            end
          when DATETIME_REGEX
            begin
              Time.zone.parse(data)
            rescue ArgumentError
              data
            end
          when Array
            data.map! { |d| convert_dates_from(d) }
          when Hash
            data.transform_values! do |value|
              convert_dates_from(value)
            end
          else
            data
          end
        end
    end
  end
end
