# frozen_string_literal: false
module REXML
  module Security
    @@entity_expansion_limit = 10_000

    # Set the entity expansion limit. By default the limit is set to 10000.
    def self.entity_expansion_limit=( val )
      @@entity_expansion_limit = val
    end

    # Get the entity expansion limit. By default the limit is set to 10000.
    def self.entity_expansion_limit
      return @@entity_expansion_limit
    end

    @@entity_expansion_text_limit = 10_240

    # Set the entity expansion limit. By default the limit is set to 10240.
    def self.entity_expansion_text_limit=( val )
      @@entity_expansion_text_limit = val
    end

    # Get the entity expansion limit. By default the limit is set to 10240.
    def self.entity_expansion_text_limit
      return @@entity_expansion_text_limit
    end
  end
end
