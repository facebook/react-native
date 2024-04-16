# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module DataSources
    # Represents a time zone defined by a data source.
    #
    # @abstract Data sources return instances of {TimezoneInfo} subclasses.
    class TimezoneInfo
      # @return [String] the identifier of the time zone.
      attr_reader :identifier

      # Initializes a new TimezoneInfo. The passed in `identifier` instance will
      # be frozen.
      #
      # @param identifier [String] the identifier of the time zone.
      # @raise [ArgumentError] if `identifier` is `nil`.
      def initialize(identifier)
        raise ArgumentError, 'identifier must be specified' unless identifier
        @identifier = identifier.freeze
      end

      # @return [String] the internal object state as a programmer-readable
      #   `String`.
      def inspect
        "#<#{self.class}: #@identifier>"
      end

      # @return [Timezone] a new {Timezone} instance for the time zone
      #   represented by this {TimezoneInfo}.
      def create_timezone
        raise_not_implemented('create_timezone')
      end

      private

      # Raises a {NotImplementedError}.
      #
      # @param method_name [String] the name of the method that must be
      #   overridden.
      # @raise NotImplementedError always.
      def raise_not_implemented(method_name)
        raise NotImplementedError, "Subclasses must override #{method_name}"
      end
    end
  end
end
