# frozen_string_literal: true

require "active_support/concern"
require "active_support/core_ext/class/attribute"
require "active_support/core_ext/string/inflections"

module ActiveSupport
  # Rescuable module adds support for easier exception handling.
  module Rescuable
    extend Concern

    included do
      class_attribute :rescue_handlers, default: []
    end

    module ClassMethods
      # Registers exception classes with a handler to be called by <tt>rescue_with_handler</tt>.
      #
      # <tt>rescue_from</tt> receives a series of exception classes or class
      # names, and an exception handler specified by a trailing <tt>:with</tt>
      # option containing the name of a method or a Proc object. Alternatively, a block
      # can be given as the handler.
      #
      # Handlers that take one argument will be called with the exception, so
      # that the exception can be inspected when dealing with it.
      #
      # Handlers are inherited. They are searched from right to left, from
      # bottom to top, and up the hierarchy. The handler of the first class for
      # which <tt>exception.is_a?(klass)</tt> holds true is the one invoked, if
      # any.
      #
      #   class ApplicationController < ActionController::Base
      #     rescue_from User::NotAuthorized, with: :deny_access
      #     rescue_from ActiveRecord::RecordInvalid, with: :show_record_errors
      #
      #     rescue_from "MyApp::BaseError" do |exception|
      #       redirect_to root_url, alert: exception.message
      #     end
      #
      #     private
      #       def deny_access
      #         head :forbidden
      #       end
      #
      #       def show_record_errors(exception)
      #         redirect_back_or_to root_url, alert: exception.record.errors.full_messages.to_sentence
      #       end
      #   end
      #
      # Exceptions raised inside exception handlers are not propagated up.
      def rescue_from(*klasses, with: nil, &block)
        unless with
          if block_given?
            with = block
          else
            raise ArgumentError, "Need a handler. Pass the with: keyword argument or provide a block."
          end
        end

        klasses.each do |klass|
          key = if klass.is_a?(Module) && klass.respond_to?(:===)
            klass.name
          elsif klass.is_a?(String)
            klass
          else
            raise ArgumentError, "#{klass.inspect} must be an Exception class or a String referencing an Exception class"
          end

          # Put the new handler at the end because the list is read in reverse.
          self.rescue_handlers += [[key, with]]
        end
      end

      # Matches an exception to a handler based on the exception class.
      #
      # If no handler matches the exception, check for a handler matching the
      # (optional) +exception.cause+. If no handler matches the exception or its
      # cause, this returns +nil+, so you can deal with unhandled exceptions.
      # Be sure to re-raise unhandled exceptions if this is what you expect.
      #
      #     begin
      #       # ...
      #     rescue => exception
      #       rescue_with_handler(exception) || raise
      #     end
      #
      # Returns the exception if it was handled and +nil+ if it was not.
      def rescue_with_handler(exception, object: self, visited_exceptions: [])
        visited_exceptions << exception

        if handler = handler_for_rescue(exception, object: object)
          handler.call exception
          exception
        elsif exception
          if visited_exceptions.include?(exception.cause)
            nil
          else
            rescue_with_handler(exception.cause, object: object, visited_exceptions: visited_exceptions)
          end
        end
      end

      def handler_for_rescue(exception, object: self) # :nodoc:
        case rescuer = find_rescue_handler(exception)
        when Symbol
          method = object.method(rescuer)
          if method.arity == 0
            -> e { method.call }
          else
            method
          end
        when Proc
          if rescuer.arity == 0
            -> e { object.instance_exec(&rescuer) }
          else
            -> e { object.instance_exec(e, &rescuer) }
          end
        end
      end

      private
        def find_rescue_handler(exception)
          if exception
            # Handlers are in order of declaration but the most recently declared
            # is the highest priority match, so we search for matching handlers
            # in reverse.
            _, handler = rescue_handlers.reverse_each.detect do |class_or_name, _|
              if klass = constantize_rescue_handler_class(class_or_name)
                klass === exception
              end
            end

            handler
          end
        end

        def constantize_rescue_handler_class(class_or_name)
          case class_or_name
          when String, Symbol
            begin
              # Try a lexical lookup first since we support
              #
              #     class Super
              #       rescue_from 'Error', with: …
              #     end
              #
              #     class Sub
              #       class Error < StandardError; end
              #     end
              #
              # so an Error raised in Sub will hit the 'Error' handler.
              const_get class_or_name
            rescue NameError
              class_or_name.safe_constantize
            end
          else
            class_or_name
          end
        end
    end

    # Delegates to the class method, but uses the instance as the subject for
    # rescue_from handlers (method calls, +instance_exec+ blocks).
    def rescue_with_handler(exception)
      self.class.rescue_with_handler exception, object: self
    end

    # Internal handler lookup. Delegates to class method. Some libraries call
    # this directly, so keeping it around for compatibility.
    def handler_for_rescue(exception) # :nodoc:
      self.class.handler_for_rescue exception, object: self
    end
  end
end
