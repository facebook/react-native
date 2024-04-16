# frozen_string_literal: true
module Ethon
  class Multi

    # This module provides the multi stack behaviour.
    module Stack

      # Return easy handles.
      #
      # @example Return easy handles.
      #   multi.easy_handles
      #
      # @return [ Array ] The easy handles.
      def easy_handles
        @easy_handles ||= []
      end

      # Add an easy to the stack.
      #
      # @example Add easy.
      #   multi.add(easy)
      #
      # @param [ Easy ] easy The easy to add.
      #
      # @raise [ Ethon::Errors::MultiAdd ] If adding an easy failed.
      def add(easy)
        return nil if easy_handles.include?(easy)

        code = Curl.multi_add_handle(handle, easy.handle)
        raise Errors::MultiAdd.new(code, easy) unless code == :ok
        easy_handles << easy
      end

      # Delete an easy from stack.
      #
      # @example Delete easy from stack.
      #
      # @param [ Easy ] easy The easy to delete.
      #
      # @raise [ Ethon::Errors::MultiRemove ] If removing an easy failed.
      def delete(easy)
        if easy_handles.delete(easy)
          code = Curl.multi_remove_handle(handle, easy.handle)
          raise Errors::MultiRemove.new(code, handle) unless code == :ok
        end
      end
    end
  end
end
