# frozen_string_literal: true
module Ethon
  class Easy
    module Http

      # This class knows everything about making OPTIONS requests.
      class Options
        include Ethon::Easy::Http::Actionable
        include Ethon::Easy::Http::Postable

        # Setup easy to make a OPTIONS request.
        #
        # @example Setup.
        #   options.setup(easy)
        #
        # @param [ Easy ] easy The easy to setup.
        def setup(easy)
          super
          easy.customrequest = "OPTIONS"
        end
      end
    end
  end
end
