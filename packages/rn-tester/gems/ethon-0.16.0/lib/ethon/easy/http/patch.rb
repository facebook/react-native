# frozen_string_literal: true
module Ethon
  class Easy
    module Http

      # This class knows everything about making PATCH requests.
      class Patch
        include Ethon::Easy::Http::Actionable
        include Ethon::Easy::Http::Postable

        # Setup easy to make a PATCH request.
        #
        # @example Setup.
        #   patch.setup(easy)
        #
        # @param [ Easy ] easy The easy to setup.
        def setup(easy)
          super
          easy.customrequest = "PATCH"
        end
      end
    end
  end
end
