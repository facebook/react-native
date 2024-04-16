# frozen_string_literal: true

require_relative "gem_version"

module ActiveSupport
  # Returns the currently loaded version of Active Support as a <tt>Gem::Version</tt>.
  def self.version
    gem_version
  end
end
