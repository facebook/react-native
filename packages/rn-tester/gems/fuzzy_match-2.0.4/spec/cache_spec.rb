require 'spec_helper'

require 'active_record'
require 'cohort_analysis'
require 'weighted_average'

ActiveRecord::Base.establish_connection(
  'adapter' => 'mysql2',
  'database' => 'fuzzy_match_test',
  'username' => 'root',
  'password' => 'password'
)

# require 'logger'
# ActiveRecord::Base.logger = Logger.new $stderr
# ActiveRecord::Base.logger.level = Logger::DEBUG

ActiveSupport::Inflector.inflections do |inflect|
  inflect.uncountable 'aircraft'
end

require 'fuzzy_match/cached_result'

::FuzzyMatch::CachedResult.setup(true)

class Aircraft < ActiveRecord::Base
  MUTEX = ::Mutex.new
  self.primary_key = 'icao_code'
  
  cache_fuzzy_match_with :flight_segments, :primary_key => :aircraft_description, :foreign_key => :aircraft_description
    
  def aircraft_description
    [manufacturer_name, model_name].compact.join(' ')
  end
  
  def self.fuzzy_match
    @fuzzy_match || MUTEX.synchronize do
      @fuzzy_match||= FuzzyMatch.new(all, :read => ::Proc.new { |straw| straw.aircraft_description })
    end
  end
  
  def self.create_table
    connection.drop_table(:aircraft) rescue nil
    connection.execute %{
CREATE TABLE `aircraft` (
  `icao_code` varchar(255) DEFAULT NULL,
  `manufacturer_name` varchar(255) DEFAULT NULL,
  `model_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`icao_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    }
    reset_column_information
  end
end

class FlightSegment < ActiveRecord::Base
  self.primary_key = 'row_hash'
  
  cache_fuzzy_match_with :aircraft, :primary_key => :aircraft_description, :foreign_key => :aircraft_description
  
  def self.create_table
    connection.drop_table(:flight_segments) rescue nil
    connection.execute %{
CREATE TABLE `flight_segments` (
  `row_hash` varchar(255) NOT NULL DEFAULT '',
  `aircraft_description` varchar(255) DEFAULT NULL,
  `passengers` int(11) DEFAULT NULL,
  `seats` int(11) DEFAULT NULL,
  PRIMARY KEY (`row_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    }
  end
end

FlightSegment.create_table
Aircraft.create_table

a = Aircraft.new
a.icao_code = 'B742'
a.manufacturer_name = 'Boeing'
a.model_name = '747-200'
a.save!

fs = FlightSegment.new
fs.row_hash = 'madison to chicago'
fs.aircraft_description = 'BORING 747200'
fs.passengers = 10
fs.seats = 10
fs.save!

fs = FlightSegment.new
fs.row_hash = 'madison to minneapolis'
fs.aircraft_description = 'bing 747'
fs.passengers = 100
fs.seats = 5
fs.save!

FlightSegment.all.each do |fs|
  fs.cache_aircraft!
end

describe FuzzyMatch::CachedResult do
  it %{joins aircraft to flight segments} do
    aircraft = Aircraft.find('B742')
    aircraft.flight_segments.count.should == 2
  end
  
  it %{allow simple SQL operations} do
    aircraft = Aircraft.find('B742')
    aircraft.flight_segments.sum(:passengers).should == 110
  end
  
  it %{works with weighted_average} do
    aircraft = Aircraft.find('B742')
    aircraft.flight_segments.weighted_average(:seats, :weighted_by => :passengers).should == 5.45455
  end
  
  it %{works with cohort_scope (albeit rather clumsily)} do
    aircraft = Aircraft.find('B742')
    cohort = FlightSegment.cohort({:aircraft_description => aircraft.flight_segments_foreign_keys}, :minimum_size => 2)
    FlightSegment.connection.select_value(cohort.project('COUNT(*)').to_sql).should == 2
    # FlightSegment.cohort(:aircraft_description => aircraft.flight_segments_foreign_keys).should == []
  end
  
  # def test_006_you_can_get_aircraft_from_flight_segments
  #   fs = FlightSegment.first
  #   # you need to add an aircraft_description column
  #   lambda do
  #     fs.aircraft.count.should == 2
  #   end.must_raise ActiveRecord::StatementInvalid
  # end
end
