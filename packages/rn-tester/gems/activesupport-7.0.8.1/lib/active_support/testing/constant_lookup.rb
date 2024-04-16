# frozen_string_literal: true

require "active_support/concern"
require "active_support/inflector"

module ActiveSupport
  module Testing
    # Resolves a constant from a minitest spec name.
    #
    # Given the following spec-style test:
    #
    #   describe WidgetsController, :index do
    #     describe "authenticated user" do
    #       describe "returns widgets" do
    #         it "has a controller that exists" do
    #           assert_kind_of WidgetsController, @controller
    #         end
    #       end
    #     end
    #   end
    #
    # The test will have the following name:
    #
    #   "WidgetsController::index::authenticated user::returns widgets"
    #
    # The constant WidgetsController can be resolved from the name.
    # The following code will resolve the constant:
    #
    #   controller = determine_constant_from_test_name(name) do |constant|
    #     Class === constant && constant < ::ActionController::Metal
    #   end
    module ConstantLookup
      extend ::ActiveSupport::Concern

      module ClassMethods  # :nodoc:
        def determine_constant_from_test_name(test_name)
          names = test_name.split "::"
          while names.size > 0 do
            names.last.sub!(/Test$/, "")
            begin
              constant = names.join("::").safe_constantize
              break(constant) if yield(constant)
            ensure
              names.pop
            end
          end
        end
      end
    end
  end
end
