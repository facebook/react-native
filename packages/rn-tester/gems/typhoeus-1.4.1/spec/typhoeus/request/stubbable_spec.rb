require 'spec_helper'

describe Typhoeus::Request::Stubbable do
  let(:base_url) { "localhost:3001" }
  let(:request) { Typhoeus::Request.new(base_url) }
  let(:response) { Typhoeus::Response.new }

  before { Typhoeus.stub(base_url).and_return(response) }

  describe "#run" do
    it "checks expectations" do
      request.run
    end

    context "when expectation found" do
      it "calls on_headers callbacks" do
        canary = :not_called
        request.on_headers do
          canary = :called
        end
        request.run
        expect(canary).to eq(:called)
      end

      it "calls on_body callbacks" do
        canary = :not_called
        request.on_body do
          canary = :called
        end
        request.run
        expect(canary).to eq(:called)
      end

      it "finishes request" do
        expect(request).to receive(:finish)
        request.run
      end

      it "sets mock on response" do
        request.run
        expect(request.response.mock).to be(true)
      end
    end
  end
end
