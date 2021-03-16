package com.incture.lch.dto;

public class ChargeResponseDto
{
	private String adhocOrderId;
	
	private String bpNumber;
	
	private int charge;

	public String getAdhocOrderId() {
		return adhocOrderId;
	}

	public void setAdhocOrderId(String adhocOrderId) {
		this.adhocOrderId = adhocOrderId;
	}

	public String getBpNumber() {
		return bpNumber;
	}

	public void setBpNumber(String bpNumber) {
		this.bpNumber = bpNumber;
	}

	public int getCharge() {
		return charge;
	}

	public void setCharge(int charge) {
		this.charge = charge;
	}
	

}
