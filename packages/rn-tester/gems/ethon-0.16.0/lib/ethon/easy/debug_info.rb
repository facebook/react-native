# frozen_string_literal: true
module Ethon
  class Easy

    # This class is used to store and retreive debug information,
    # which is only saved when verbose is set to true.
    #
    # @api private
    class DebugInfo

      MESSAGE_TYPES = Ethon::Curl::DebugInfoType.to_h.keys

      class Message
        attr_reader :type, :message

        def initialize(type, message)
          @type = type
          @message = message
        end
      end

      def initialize
        @messages = []
      end

      def add(type, message)
        @messages << Message.new(type, message)
      end

      def messages_for(type)
        @messages.select {|m| m.type == type }.map(&:message)
      end

      MESSAGE_TYPES.each do |type|
        eval %Q|def #{type}; messages_for(:#{type}); end|
      end

      def to_a
        @messages.map(&:message)
      end

      def to_h
        Hash[MESSAGE_TYPES.map {|k| [k, send(k)] }]
      end
    end
  end
end
