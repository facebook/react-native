# frozen_string_literal: true
module Ethon
  class Easy

    # This module contains the logic and knowledge about the
    # available options on easy.
    module Options
      attr_reader :url

      def url=(value)
        @url = value
        Curl.set_option(:url, value, handle)
      end

      def escape=( b )
        @escape = b
      end

      def escape?
        return true if !defined?(@escape) || @escape.nil?
        @escape
      end

      def multipart=(b)
        @multipart = b
      end

      def multipart?
        !!@multipart
      end

      Curl.easy_options(nil).each do |opt, props|
        method_name = "#{opt}=".freeze
        unless method_defined? method_name
          define_method(method_name) do |value|
            Curl.set_option(opt, value, handle)
            value
          end
        end
        next if props[:type] != :callback || method_defined?(opt)
        define_method(opt) do |&block|
          @procs ||= {}
          @procs[opt.to_sym] = block
          Curl.set_option(opt, block, handle)
          nil
        end
      end
    end
  end
end
