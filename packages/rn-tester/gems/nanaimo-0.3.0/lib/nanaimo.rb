# frozen_string_literal: true

require 'nanaimo/version'

# A native Ruby implementation of ASCII plist parsing and serialization.
#
module Nanaimo
  class Error < StandardError; end

  DEBUG = !ENV['NANAIMO_DEBUG'].nil?
  private_constant :DEBUG
  def self.debug
    return unless DEBUG
    warn yield
  end

  require 'nanaimo/object'
  require 'nanaimo/plist'
  require 'nanaimo/reader'
  require 'nanaimo/unicode'
  require 'nanaimo/writer'
end
