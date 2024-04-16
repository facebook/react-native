require File.expand_path('../spec_helper', File.dirname(__FILE__))

# The CocoaPods namespace
#
module Pod
  describe Command::GemIndexCache do
    before do
      @cache = Command::GemIndexCache.new
      UI.output = ''
    end

    after do
      mocha_teardown
    end

    it 'notifies the user that it is downloading the spec index' do
      response = [{}, []]
      Gem::SpecFetcher.any_instance.stubs(:available_specs).returns(response)

      @cache.download_and_cache_specs
      UI.output.should.include('Downloading Rubygem specification index...')
      UI.output.should.not.include('Error downloading Rubygem specification')
    end

    it 'notifies the user when getting the spec index fails' do
      error = Gem::RemoteFetcher::FetchError.new('no host', 'bad url')
      wrapper_error = stub(:error => error)
      response = [[], [wrapper_error]]
      Gem::SpecFetcher.any_instance.stubs(:available_specs).returns(response)

      @cache.download_and_cache_specs
      @cache.specs.should.be.empty?
      UI.output.should.include('Downloading Rubygem specification index...')
      UI.output.should.include('Error downloading Rubygem specification')
    end
  end
end
