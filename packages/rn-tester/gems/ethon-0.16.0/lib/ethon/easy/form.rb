# frozen_string_literal: true
require 'ethon/easy/util'
require 'ethon/easy/queryable'

module Ethon
  class Easy

    # This class represents a form and is used to send a payload in the
    # request body via POST/PUT.
    # It handles multipart forms, too.
    #
    # @api private
    class Form
      include Ethon::Easy::Util
      include Ethon::Easy::Queryable

      # Return a new Form.
      #
      # @example Return a new Form.
      #   Form.new({})
      #
      # @param [ Hash ] params The parameter with which to initialize the form.
      #
      # @return [ Form ] A new Form.
      def initialize(easy, params, multipart = nil)
        @easy = easy
        @params = params || {}
        @multipart = multipart
      end

      # Return a pointer to the first form element in libcurl.
      #
      # @example Return the first form element.
      #   form.first
      #
      # @return [ FFI::Pointer ] The first element.
      def first
        @first ||= FFI::MemoryPointer.new(:pointer)
      end

      # Return a pointer to the last form element in libcurl.
      #
      # @example Return the last form element.
      #   form.last
      #
      # @return [ FFI::Pointer ] The last element.
      def last
        @last ||= FFI::MemoryPointer.new(:pointer)
      end

      # Return if form is multipart. The form is multipart
      # when it contains a file or multipart option is set on the form during creation.
      #
      # @example Return if form is multipart.
      #   form.multipart?
      #
      # @return [ Boolean ] True if form is multipart, else false.
      def multipart?
        return true if @multipart
        query_pairs.any?{|pair| pair.respond_to?(:last) && pair.last.is_a?(Array)}
      end

      # Add form elements to libcurl.
      #
      # @example Add form to libcurl.
      #   form.materialize
      def materialize
        query_pairs.each { |pair| form_add(pair.first.to_s, pair.last) }
      end

      private

      def form_add(name, content)
        case content
        when Array
          Curl.formadd(first, last,
                       :form_option, :copyname, :pointer, name,
                       :form_option, :namelength, :long, name.bytesize,
                       :form_option, :file, :string, content[2],
                       :form_option, :filename, :string, content[0],
                       :form_option, :contenttype, :string, content[1],
                       :form_option, :end
                      )
        else
          Curl.formadd(first, last,
                       :form_option, :copyname, :pointer, name,
                       :form_option, :namelength, :long, name.bytesize,
                       :form_option, :copycontents, :pointer, content.to_s,
                       :form_option, :contentslength, :long, content ? content.to_s.bytesize : 0,
                       :form_option, :end
                      )
        end

        setup_garbage_collection
      end

      def setup_garbage_collection
        # first is a pointer to a pointer. Since it's a MemoryPointer it will
        # auto clean itself up, but we need to clean up the object it points
        # to. So this results in (pseudo-c):
        #   form_data_cleanup_handler = *first
        #   curl_form_free(form_data_cleanup_handler)
        @form_data_cleanup_handler ||= FFI::AutoPointer.new(@first.get_pointer(0), Curl.method(:formfree))
      end
    end
  end
end
