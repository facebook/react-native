#!/usr/bin/env ruby

require 'rubygems'
require 'memprof'
require 'bundler'
Bundler.setup
require 'remote_table'
$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))
require 'fuzzy_match'

# messily stolen from the bts example

# The records that your dictionary will return.
# (Example) A table of aircraft as defined by the U.S. Bureau of Transportation Statistics
HAYSTACK = RemoteTable.new :url => "file://#{File.expand_path('../../examples/bts_aircraft/number_260.csv', __FILE__)}", :select => lambda { |record| record['Aircraft Type'].to_i.between?(1, 998) and record['Manufacturer'].present? }

# A reader used to convert every record (which could be an object of any type) into a string that will be used for similarity.
# (Example) Combine the make and model into something like "boeing 747"
# Note the downcase!
HAYSTACK_READER = lambda { |record| "#{record['Manufacturer']} #{record['Long Name']}".downcase }

# Whether to even bother trying to find a match for something without an explicit group
# (Example) False, which is the default, which means we have more work to do
MUST_MATCH_GROUPING = false

# Groupings
# (Example) We made these by trial and error
GROUPINGS = RemoteTable.new(:url => "file://#{File.expand_path("../../examples/bts_aircraft/groupings.csv", __FILE__)}", :headers => :first_row).map { |row| row['regexp'] }

# Normalizers
# (Example) We made these by trial and error
NORMALIZERS = RemoteTable.new(:url => "file://#{File.expand_path("../../examples/bts_aircraft/normalizers.csv", __FILE__)}", :headers => :first_row).map { |row| row['regexp'] }

# Identities
# (Example) We made these by trial and error
IDENTITIES = RemoteTable.new(:url => "file://#{File.expand_path("../../examples/bts_aircraft/identities.csv", __FILE__)}", :headers => :first_row).map { |row| row['regexp'] }

FINAL_OPTIONS = {
  :read => HAYSTACK_READER,
  :must_match_grouping => MUST_MATCH_GROUPING,
  :normalizers => NORMALIZERS,
  :identities => IDENTITIES,
  :groupings => GROUPINGS
}

Memprof.start

d = FuzzyMatch.new HAYSTACK, FINAL_OPTIONS
record = d.find('boeing 707(100)', :gather_last_result => false)

Memprof.stats
Memprof.stop
