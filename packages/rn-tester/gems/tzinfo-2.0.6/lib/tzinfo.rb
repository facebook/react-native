# encoding: UTF-8
# frozen_string_literal: true

# The top level module for TZInfo.
module TZInfo
  class << self
    # Instructs the current {DataSource} to load all timezone and country data
    # into memory (initializing the {DataSource} first if not previously
    # accessed or set).
    #
    # This may be desirable in production environments to improve copy-on-write
    # performance and to avoid flushing the constant cache every time a new
    # timezone or country is loaded from {DataSources::RubyDataSource}.
    def eager_load!
      DataSource.get.eager_load!
    end
  end
end


require_relative 'tzinfo/ruby_core_support'

require_relative 'tzinfo/version'

require_relative 'tzinfo/string_deduper'

require_relative 'tzinfo/timestamp'

require_relative 'tzinfo/with_offset'
require_relative 'tzinfo/datetime_with_offset'
require_relative 'tzinfo/time_with_offset'
require_relative 'tzinfo/timestamp_with_offset'

require_relative 'tzinfo/timezone_offset'
require_relative 'tzinfo/timezone_transition'
require_relative 'tzinfo/transition_rule'
require_relative 'tzinfo/annual_rules'

require_relative 'tzinfo/data_sources'
require_relative 'tzinfo/data_sources/timezone_info'
require_relative 'tzinfo/data_sources/data_timezone_info'
require_relative 'tzinfo/data_sources/linked_timezone_info'
require_relative 'tzinfo/data_sources/constant_offset_data_timezone_info'
require_relative 'tzinfo/data_sources/transitions_data_timezone_info'

require_relative 'tzinfo/data_sources/country_info'

require_relative 'tzinfo/data_sources/posix_time_zone_parser'
require_relative 'tzinfo/data_sources/zoneinfo_reader'

require_relative 'tzinfo/data_source'
require_relative 'tzinfo/data_sources/ruby_data_source'
require_relative 'tzinfo/data_sources/zoneinfo_data_source'

require_relative 'tzinfo/timezone_period'
require_relative 'tzinfo/offset_timezone_period'
require_relative 'tzinfo/transitions_timezone_period'
require_relative 'tzinfo/timezone'
require_relative 'tzinfo/info_timezone'
require_relative 'tzinfo/data_timezone'
require_relative 'tzinfo/linked_timezone'
require_relative 'tzinfo/timezone_proxy'

require_relative 'tzinfo/country'
require_relative 'tzinfo/country_timezone'

require_relative 'tzinfo/format2'
require_relative 'tzinfo/format2/country_definer'
require_relative 'tzinfo/format2/country_index_definer'
require_relative 'tzinfo/format2/country_index_definition'
require_relative 'tzinfo/format2/timezone_definer'
require_relative 'tzinfo/format2/timezone_definition'
require_relative 'tzinfo/format2/timezone_index_definer'
require_relative 'tzinfo/format2/timezone_index_definition'

require_relative 'tzinfo/format1'
require_relative 'tzinfo/format1/country_definer'
require_relative 'tzinfo/format1/country_index_definition'
require_relative 'tzinfo/format1/timezone_definer'
require_relative 'tzinfo/format1/timezone_definition'
require_relative 'tzinfo/format1/timezone_index_definition'
