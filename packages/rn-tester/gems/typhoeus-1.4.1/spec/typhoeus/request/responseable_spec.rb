require 'spec_helper'

describe Typhoeus::Request::Responseable do
  let(:request) { Typhoeus::Request.new("base_url", {}) }
  let(:response) { Typhoeus::Response.new }

  describe "#response=" do
    it "stores response" do
      request.response = response
      expect(request.response).to eq(response)
    end
  end
end
