# encoding: UTF-8

module TZInfo
  module Format2
    # The format 2 time zone index file includes {TimezoneIndexDefinition},
    # which provides the {TimezoneIndexDefinition::ClassMethods#timezone_index
    # timezone_index} method used to define the index.
    #
    # @private
    module TimezoneIndexDefinition #:nodoc:
      # Adds class methods to the includee and initializes class instance
      # variables.
      #
      # @param base [Module] the includee.
      def self.append_features(base)
        super
        base.extend(ClassMethods)
        base.instance_eval do
          empty = [].freeze
          @timezones = empty
          @data_timezones = empty
          @linked_timezones = empty
        end
      end

      # Class methods for inclusion.
      #
      # @private
      module ClassMethods #:nodoc:
        # @return [Array<String>] a frozen `Array` containing the identifiers of
        #   all data time zones. Identifiers are sorted according to
        #   `String#<=>`.
        attr_reader :data_timezones

        # @return [Array<String>] a frozen `Array` containing the identifiers of
        #   all linked time zones. Identifiers are sorted according to
        #   `String#<=>`.
        attr_reader :linked_timezones

        # Defines the index.
        #
        # @yield [definer] yields to the caller to allow the index to be
        #   defined.
        # @yieldparam definer [TimezoneIndexDefiner] a {TimezoneIndexDefiner}
        #   instance that should be used to define the index.
        def timezone_index
          definer = TimezoneIndexDefiner.new(StringDeduper.global)
          yield definer
          @data_timezones = definer.data_timezones.sort!.freeze
          @linked_timezones = definer.linked_timezones.sort!.freeze
        end
      end
    end
  end
end
