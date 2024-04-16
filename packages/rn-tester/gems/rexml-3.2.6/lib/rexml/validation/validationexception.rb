# frozen_string_literal: false
module REXML
  module Validation
    class ValidationException < RuntimeError
      def initialize msg
        super
      end
    end
  end
end
