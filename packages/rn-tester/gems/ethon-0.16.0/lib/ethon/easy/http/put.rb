# frozen_string_literal: true
module Ethon
  class Easy
    module Http

      # This class knows everything about making PUT requests.
      class Put
        include Ethon::Easy::Http::Actionable
        include Ethon::Easy::Http::Putable

        # Setup easy to make a PUT request.
        #
        # @example Setup.
        #   put.setup(easy)
        #
        # @param [ Easy ] easy The easy to setup.
        def setup(easy)
          super
          if form.empty?
            easy.upload = true
            easy.infilesize = 0
          end
        end
      end
    end
  end
end
