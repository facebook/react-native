require 'spec_helper'

describe Typhoeus::Hydra::Stubbable do
  let(:base_url) { "localhost:3001" }
  let(:request) { Typhoeus::Request.new(base_url) }
  let(:response) { Typhoeus::Response.new }
  let(:hydra) { Typhoeus::Hydra.new }

  before { Typhoeus.stub(base_url).and_return(response) }

  describe "#add" do
    it "checks expectations" do
      hydra.add(request)
    end

    context "when expectation found" do
      it "calls on_headers callbacks" do
        canary = :not_called
        request.on_headers do
          canary = :called
        end
        hydra.add(request)
        hydra.run
        expect(canary).to eq(:called)
      end

      it "calls on_body callbacks" do
        canary = :not_called
        request.on_body do
          canary = :called
        end
        hydra.add(request)
        hydra.run
        expect(canary).to eq(:called)
      end

      it "finishes response" do
        expect(request).to receive(:finish)
        hydra.add(request)
      end

      it "is a mock" do
        hydra.add(request)
        expect(request.response.mock).to be(true)
      end
    end
  end
end
