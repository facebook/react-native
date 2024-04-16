require 'spec_helper'

describe Typhoeus::Hydra::Addable do
  let(:hydra) { Typhoeus::Hydra.new() }
  let(:request) { Typhoeus::Request.new("localhost:3001", {:method => :get}) }

  it "asks easy factory for an easy" do
    multi = double
    expect(Typhoeus::EasyFactory).to receive(:new).with(request, hydra).and_return(double(:get => 1))
    expect(hydra).to receive(:multi).and_return(multi)
    expect(multi).to receive(:add).with(1)
    hydra.add(request)
  end

  it "adds easy to multi" do
    multi = double
    expect(Typhoeus::EasyFactory).to receive(:new).with(request, hydra).and_return(double(:get => 1))
    expect(hydra).to receive(:multi).and_return(multi)
    expect(multi).to receive(:add).with(1)
    hydra.add(request)
  end
end
