# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module DataSources
    # A {TZInfoDataNotFound} exception is raised if the tzinfo-data gem could
    # not be found (i.e. `require 'tzinfo/data'` failed) when selecting the Ruby
    # data source.
    class TZInfoDataNotFound < StandardError
    end

    # A DataSource implementation that loads data from the set of Ruby modules
    # included in the tzinfo-data gem.
    #
    # TZInfo will use {RubyDataSource} by default if the tzinfo-data gem
    # is available on the load path. It can also be selected by calling
    # {DataSource.set} as follows:
    #
    #     TZInfo::DataSource.set(:ruby)
    class RubyDataSource < DataSource
      # (see DataSource#data_timezone_identifiers)
      attr_reader :data_timezone_identifiers

      # (see DataSource#linked_timezone_identifiers)
      attr_reader :linked_timezone_identifiers

      # (see DataSource#country_codes)
      attr_reader :country_codes

      # Initializes a new {RubyDataSource} instance.
      #
      # @raise [TZInfoDataNotFound] if the tzinfo-data gem could not be found
      #   (i.e. `require 'tzinfo/data'` failed).
      def initialize
        super

        begin
          require('tzinfo/data')
        rescue LoadError
          raise TZInfoDataNotFound, "The tzinfo-data gem could not be found (require 'tzinfo/data' failed)."
        end

        if TZInfo::Data.const_defined?(:LOCATION)
          # Format 2
          @base_path = File.join(TZInfo::Data::LOCATION, 'tzinfo', 'data')
        else
          # Format 1
          data_file = File.join('', 'tzinfo', 'data.rb')
          path = $".reverse_each.detect {|p| p.end_with?(data_file) }
          if path
            @base_path = RubyCoreSupport.untaint(File.join(File.dirname(path), 'data'))
          else
            @base_path = 'tzinfo/data'
          end
        end

        require_index('timezones')
        require_index('countries')

        @data_timezone_identifiers = Data::Indexes::Timezones.data_timezones
        @linked_timezone_identifiers = Data::Indexes::Timezones.linked_timezones
        @countries = Data::Indexes::Countries.countries
        @country_codes = @countries.keys.sort!.freeze
      end

      # (see DataSource#to_s)
      def to_s
        "Ruby DataSource: #{version_info}"
      end

      # (see DataSource#inspect)
      def inspect
        "#<TZInfo::DataSources::RubyDataSource: #{version_info}>"
      end

      protected

      # Returns a {TimezoneInfo} instance for the given time zone identifier.
      # The result will either be a {ConstantOffsetDataTimezoneInfo}, a
      # {TransitionsDataTimezoneInfo} or a {LinkedTimezoneInfo} depending on the
      # type of time zone.
      #
      # @param identifier [String] A time zone identifier.
      # @return [TimezoneInfo] a {TimezoneInfo} instance for the given time zone
      #   identifier.
      # @raise [InvalidTimezoneIdentifier] if the time zone is not found or the
      #   identifier is invalid.
      def load_timezone_info(identifier)
        valid_identifier = validate_timezone_identifier(identifier)
        split_identifier = valid_identifier.gsub(/-/, '__m__').gsub(/\+/, '__p__').split('/')

        begin
          require_definition(split_identifier)

          m = Data::Definitions
          split_identifier.each {|part| m = m.const_get(part) }
          m.get
        rescue LoadError, NameError => e
          raise InvalidTimezoneIdentifier, "#{e.message.encode(Encoding::UTF_8)} (loading #{valid_identifier})"
        end
      end

      # (see DataSource#load_country_info)
      def load_country_info(code)
        lookup_country_info(@countries, code)
      end

      private

      # Requires a zone definition by its identifier (split on /).
      #
      # @param identifier [Array<string>] the component parts of a time zone
      #   identifier (split on /). This must have already been validated.
      def require_definition(identifier)
        require_data('definitions', *identifier)
      end

      # Requires an index by its name.
      #
      # @param name [String] an index name.
      def require_index(name)
        require_data('indexes', name)
      end

      # Requires a file from tzinfo/data.
      #
      # @param file [Array<String>] a relative path to a file to be required.
      def require_data(*file)
        require(File.join(@base_path, *file))
      end

      # @return [String] a `String` containing TZInfo::Data version infomation
      #   for inclusion in the #to_s and #inspect output.
      def version_info
        # The TZInfo::Data::VERSION constant is only available from v1.2014.8
        # onwards.
        "tzdb v#{TZInfo::Data::Version::TZDATA}#{TZInfo::Data.const_defined?(:VERSION) ? ", tzinfo-data v#{TZInfo::Data::VERSION}" : ''}"
      end
    end
  end
end
