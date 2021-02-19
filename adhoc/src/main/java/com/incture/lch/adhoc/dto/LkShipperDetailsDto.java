package com.incture.lch.adhoc.dto;

public class LkShipperDetailsDto {

	private Long bpNumber;
	private String shipperName;
	private String shipperCity;
	private String shipperState;
	private String shipperZip;
	private String shipperCountry;
	private String shipperContact;
	private boolean onetimeLoc;
	private String onetimeLocId;

	public Long getBpNumber() {
		return bpNumber;
	}

	public void setBpNumber(Long bpNumber) {
		this.bpNumber = bpNumber;
	}

	public String getShipperName() {
		return shipperName;
	}

	public void setShipperName(String shipperName) {
		this.shipperName = shipperName;
	}

	public String getShipperCity() {
		return shipperCity;
	}

	public void setShipperCity(String shipperCity) {
		this.shipperCity = shipperCity;
	}

	public String getShipperState() {
		return shipperState;
	}

	public void setShipperState(String shipperState) {
		this.shipperState = shipperState;
	}

	public String getShipperZip() {
		return shipperZip;
	}

	public void setShipperZip(String shipperZip) {
		this.shipperZip = shipperZip;
	}

	public String getShipperCountry() {
		return shipperCountry;
	}

	public void setShipperCountry(String shipperCountry) {
		this.shipperCountry = shipperCountry;
	}

	public String getShipperContact() {
		return shipperContact;
	}

	public void setShipperContact(String shipperContact) {
		this.shipperContact = shipperContact;
	}

	public boolean isOnetimeLoc() {
		return onetimeLoc;
	}

	public void setOnetimeLoc(boolean onetimeLoc) {
		this.onetimeLoc = onetimeLoc;
	}

	public String getOnetimeLocId() {
		return onetimeLocId;
	}

	public void setOnetimeLocId(String onetimeLocId) {
		this.onetimeLocId = onetimeLocId;
	}

	@Override
	public String toString() {
		return "LkShipperDetailsDto [bpNumber=" + bpNumber + ", shipperName=" + shipperName + ", shipperCity="
				+ shipperCity + ", shipperState=" + shipperState + ", shipperZip=" + shipperZip + ", shipperCountry="
				+ shipperCountry + ", shipperContact=" + shipperContact + ", onetimeLoc=" + onetimeLoc
				+ ", onetimeLocId=" + onetimeLocId + "]";
	}

}
