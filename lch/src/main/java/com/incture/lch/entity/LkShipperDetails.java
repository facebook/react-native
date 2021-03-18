package com.incture.lch.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "T_SHIPPER_DET")
public class LkShipperDetails {

	@Id
	@Column(name = "BP_NUM")
	private Long bpNumber;

	@Column(name = "SHIPPER_NAME", length = 50)
	private String shipperName;

	@Column(name = "SHIPPER_CITY", length = 20)
	private String shipperCity;

	@Column(name = "SHIPPER_STATE", length = 10)
	private String shipperState;

	@Column(name = "SHIPPER_ZIP", length = 8)
	private String shipperZip;

	@Column(name = "SHIPPER_COUNTRY", length = 5)
	private String shipperCountry;

	@Column(name = "SHIPPER_CONTACT", length = 50)
	private String shipperContact;

	@Column(name = "ONETIME_LOC")
	private boolean onetimeLoc;

	@Column(name = "ONETIME_LOC_ID", length = 16)
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

}
