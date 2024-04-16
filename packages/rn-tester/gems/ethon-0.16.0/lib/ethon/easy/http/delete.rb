# frozen_string_literal: true
module Ethon
  class Easy
    module Http

      # This class knows everything about making DELETE requests.
      class Delete
        include Ethon::Easy::Http::Actionable
        include Ethon::Easy::Http::Postable

        # Setup easy to make a DELETE request.
        #
        # @example Setup customrequest.
        #   delete.setup(easy)
        #
        # @param [ Easy ] easy The easy to setup.
        def setup(easy)
          super
          easy.customrequest = "DELETE"
        end
      end
    end
  end
end

