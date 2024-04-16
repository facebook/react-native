module Pod
  module Downloader
    # A response to a download request.
    #
    # @attr [Pathname] location
    #       the location where this downloaded pod is stored on disk.
    #
    # @attr [Specification] spec
    #       the specification that describes this downloaded pod.
    #
    # @attr [Hash<Symbol, String>] checkout_options
    #       the downloader parameters necessary to recreate this exact download.
    #
    Response = Struct.new(:location, :spec, :checkout_options)
  end
end
