# frozen_string_literal: true

module ActiveSupport
  # Actionable errors lets you define actions to resolve an error.
  #
  # To make an error actionable, include the <tt>ActiveSupport::ActionableError</tt>
  # module and invoke the +action+ class macro to define the action. An action
  # needs a name and a block to execute.
  module ActionableError
    extend Concern

    class NonActionable < StandardError; end

    included do
      class_attribute :_actions, default: {}
    end

    def self.actions(error) # :nodoc:
      case error
      when ActionableError, -> it { Class === it && it < ActionableError }
        error._actions
      else
        {}
      end
    end

    def self.dispatch(error, name) # :nodoc:
      actions(error).fetch(name).call
    rescue KeyError
      raise NonActionable, "Cannot find action \"#{name}\""
    end

    module ClassMethods
      # Defines an action that can resolve the error.
      #
      #   class PendingMigrationError < MigrationError
      #     include ActiveSupport::ActionableError
      #
      #     action "Run pending migrations" do
      #       ActiveRecord::Tasks::DatabaseTasks.migrate
      #     end
      #   end
      def action(name, &block)
        _actions[name] = block
      end
    end
  end
end
