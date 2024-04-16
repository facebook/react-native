require 'redis'
require 'typhoeus/cache/redis'
require 'spec_helper'

describe Typhoeus::Cache::Redis do
  let(:redis) { instance_double(Redis) }
  let(:cache) { Typhoeus::Cache::Redis.new(redis) }

  let(:base_url) { "localhost:3001" }
  let(:request) { Typhoeus::Request.new(base_url, {:method => :get}) }
  let(:response) { Typhoeus::Response.new(:response_code => 0, :return_code => 0, :mock => true) }
  let(:serialized_response) { Marshal.dump(response) }

  describe "#set" do
    it "sends the serialized request to Redis" do
      expect(redis).to receive(:set).with(request.cache_key, serialized_response)
      expect(redis).to_not receive(:expire).with(request.cache_key, request.cache_ttl)

      cache.set(request, response)
    end
  end

  describe "#get" do
    it "returns nil when the key is not in Redis" do
      expect(redis).to receive(:get).with(request.cache_key).and_return(nil)

      expect(cache.get(request)).to be_nil
    end

    it "returns the cached response when the key is in Redis" do
      expect(redis).to receive(:get).with(request.cache_key).and_return(serialized_response)

      result = cache.get(request)
      expect(result).to_not be_nil
      expect(result.response_code).to eq(response.response_code)
      expect(result.return_code).to eq(response.return_code)
      expect(result.headers).to eq(response.headers)
      expect(result.body).to eq(response.body)
    end
  end
end
