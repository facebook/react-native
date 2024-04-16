# frozen_string_literal: true

require "active_support/callbacks"
require "active_support/core_ext/enumerable"
require "active_support/core_ext/module/delegation"

module ActiveSupport
  # Abstract super class that provides a thread-isolated attributes singleton, which resets automatically
  # before and after each request. This allows you to keep all the per-request attributes easily
  # available to the whole system.
  #
  # The following full app-like example demonstrates how to use a Current class to
  # facilitate easy access to the global, per-request attributes without passing them deeply
  # around everywhere:
  #
  #   # app/models/current.rb
  #   class Current < ActiveSupport::CurrentAttributes
  #     attribute :account, :user
  #     attribute :request_id, :user_agent, :ip_address
  #
  #     resets { Time.zone = nil }
  #
  #     def user=(user)
  #       super
  #       self.account = user.account
  #       Time.zone    = user.time_zone
  #     end
  #   end
  #
  #   # app/controllers/concerns/authentication.rb
  #   module Authentication
  #     extend ActiveSupport::Concern
  #
  #     included do
  #       before_action :authenticate
  #     end
  #
  #     private
  #       def authenticate
  #         if authenticated_user = User.find_by(id: cookies.encrypted[:user_id])
  #           Current.user = authenticated_user
  #         else
  #           redirect_to new_session_url
  #         end
  #       end
  #   end
  #
  #   # app/controllers/concerns/set_current_request_details.rb
  #   module SetCurrentRequestDetails
  #     extend ActiveSupport::Concern
  #
  #     included do
  #       before_action do
  #         Current.request_id = request.uuid
  #         Current.user_agent = request.user_agent
  #         Current.ip_address = request.ip
  #       end
  #     end
  #   end
  #
  #   class ApplicationController < ActionController::Base
  #     include Authentication
  #     include SetCurrentRequestDetails
  #   end
  #
  #   class MessagesController < ApplicationController
  #     def create
  #       Current.account.messages.create(message_params)
  #     end
  #   end
  #
  #   class Message < ApplicationRecord
  #     belongs_to :creator, default: -> { Current.user }
  #     after_create { |message| Event.create(record: message) }
  #   end
  #
  #   class Event < ApplicationRecord
  #     before_create do
  #       self.request_id = Current.request_id
  #       self.user_agent = Current.user_agent
  #       self.ip_address = Current.ip_address
  #     end
  #   end
  #
  # A word of caution: It's easy to overdo a global singleton like Current and tangle your model as a result.
  # Current should only be used for a few, top-level globals, like account, user, and request details.
  # The attributes stuck in Current should be used by more or less all actions on all requests. If you start
  # sticking controller-specific attributes in there, you're going to create a mess.
  class CurrentAttributes
    include ActiveSupport::Callbacks
    define_callbacks :reset

    class << self
      # Returns singleton instance for this class in this thread. If none exists, one is created.
      def instance
        current_instances[current_instances_key] ||= new
      end

      # Declares one or more attributes that will be given both class and instance accessor methods.
      def attribute(*names)
        ActiveSupport::CodeGenerator.batch(generated_attribute_methods, __FILE__, __LINE__) do |owner|
          names.each do |name|
            owner.define_cached_method(name, namespace: :current_attributes) do |batch|
              batch <<
                "def #{name}" <<
                "attributes[:#{name}]" <<
                "end"
            end
            owner.define_cached_method("#{name}=", namespace: :current_attributes) do |batch|
              batch <<
                "def #{name}=(value)" <<
                "attributes[:#{name}] = value" <<
                "end"
            end
          end
        end

        ActiveSupport::CodeGenerator.batch(singleton_class, __FILE__, __LINE__) do |owner|
          names.each do |name|
            owner.define_cached_method(name, namespace: :current_attributes_delegation) do |batch|
              batch <<
                "def #{name}" <<
                "instance.#{name}" <<
                "end"
            end
            owner.define_cached_method("#{name}=", namespace: :current_attributes_delegation) do |batch|
              batch <<
                "def #{name}=(value)" <<
                "instance.#{name} = value" <<
                "end"
            end
          end
        end
      end

      # Calls this block before #reset is called on the instance. Used for resetting external collaborators that depend on current values.
      def before_reset(&block)
        set_callback :reset, :before, &block
      end

      # Calls this block after #reset is called on the instance. Used for resetting external collaborators, like Time.zone.
      def resets(&block)
        set_callback :reset, :after, &block
      end
      alias_method :after_reset, :resets

      delegate :set, :reset, to: :instance

      def reset_all # :nodoc:
        current_instances.each_value(&:reset)
      end

      def clear_all # :nodoc:
        reset_all
        current_instances.clear
      end

      private
        def generated_attribute_methods
          @generated_attribute_methods ||= Module.new.tap { |mod| include mod }
        end

        def current_instances
          IsolatedExecutionState[:current_attributes_instances] ||= {}
        end

        def current_instances_key
          @current_instances_key ||= name.to_sym
        end

        def method_missing(name, *args, &block)
          # Caches the method definition as a singleton method of the receiver.
          #
          # By letting #delegate handle it, we avoid an enclosure that'll capture args.
          singleton_class.delegate name, to: :instance

          send(name, *args, &block)
        end
        ruby2_keywords(:method_missing)

        def respond_to_missing?(name, _)
          super || instance.respond_to?(name)
        end
    end

    attr_accessor :attributes

    def initialize
      @attributes = {}
    end

    # Expose one or more attributes within a block. Old values are returned after the block concludes.
    # Example demonstrating the common use of needing to set Current attributes outside the request-cycle:
    #
    #   class Chat::PublicationJob < ApplicationJob
    #     def perform(attributes, room_number, creator)
    #       Current.set(person: creator) do
    #         Chat::Publisher.publish(attributes: attributes, room_number: room_number)
    #       end
    #     end
    #   end
    def set(set_attributes)
      old_attributes = compute_attributes(set_attributes.keys)
      assign_attributes(set_attributes)
      yield
    ensure
      assign_attributes(old_attributes)
    end

    # Reset all attributes. Should be called before and after actions, when used as a per-request singleton.
    def reset
      run_callbacks :reset do
        self.attributes = {}
      end
    end

    private
      def assign_attributes(new_attributes)
        new_attributes.each { |key, value| public_send("#{key}=", value) }
      end

      def compute_attributes(keys)
        keys.index_with { |key| public_send(key) }
      end
  end
end
