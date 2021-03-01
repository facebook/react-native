package com.incture.lch.adhoc.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name= "T_Preference")
public class Preference 
{
	@Id
	private String PreferenceId;
	
	@Column(name="adhocOrderId")
	private String adhocOrderId;
	
	@Column(name ="businessDivision")
	private String businessDivision;
	
	@Column(name ="countryOrigin")
	private String countryOrigin;
	
	@Column(name ="createdBy")
	private String createdBy;
	
	@Column(name ="createdDate")
	private String createdDate;
	 
	@Column(name ="currency")
	private String currency;
	
	@Column(name ="destinationAddress")
	private String destinationAddress;
	

	@Column(name ="destinationCity")
	private String destinationCity;
	

	@Column(name ="destinamtionName")
	private String destinationName;
	

	@Column(name ="destinationState")
	private String destinationState;
	


	@Column(name ="destinationZip")
	private String destinationZip;
	

	@Column(name ="expectedDeliveryDate")
	private String expectedDeliveryDate;
	

	@Column(name ="originAddress")
	private String originAddress;
	

	@Column(name ="originCity")
	private String originCity;
	

	@Column(name ="originState")
	private String originState;
	

	@Column(name ="originZip")
	private String originZip;
	

	@Column(name ="ppackageType")
	private String packageType;
	

	@Column(name ="partNum")
	private String partNum;
	

	@Column(name ="partDescription")
	private String partDescription;
	@Column(name ="quantity")
	private String quantity;
	@Column(name ="shipDate")
	private String shipDate;

	@Column(name ="weight")
	private String weight;

	public String getPreferenceId() {
		return PreferenceId;
	}

	public void setPreferenceId(String preferenceId) {
		PreferenceId = preferenceId;
	}

	public String getBusinessDivision() {
		return businessDivision;
	}

	public void setBusinessDivision(String businessDivision) {
		this.businessDivision = businessDivision;
	}

	public String getCountryOrigin() {
		return countryOrigin;
	}

	public void setCountryOrigin(String countryOrigin) {
		this.countryOrigin = countryOrigin;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	public String getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(String createdDate) {
		this.createdDate = createdDate;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public String getDestinationAddress() {
		return destinationAddress;
	}

	public void setDestinationAddress(String destinationAddress) {
		this.destinationAddress = destinationAddress;
	}

	public String getDestinationCity() {
		return destinationCity;
	}

	public void setDestinationCity(String destinationCity) {
		this.destinationCity = destinationCity;
	}

	public String getDestinationName() {
		return destinationName;
	}

	public void setDestinationName(String destinationName) {
		this.destinationName = destinationName;
	}

	public String getDestinationState() {
		return destinationState;
	}

	public void setDestinationState(String destinationState) {
		this.destinationState = destinationState;
	}

	public String getDestinationZip() {
		return destinationZip;
	}

	public void setDestinationZip(String destinationZip) {
		this.destinationZip = destinationZip;
	}

	public String getExpectedDeliveryDate() {
		return expectedDeliveryDate;
	}

	public void setExpectedDeliveryDate(String expectedDeliveryDate) {
		this.expectedDeliveryDate = expectedDeliveryDate;
	}

	public String getOriginAddress() {
		return originAddress;
	}

	public void setOriginAddress(String originAddress) {
		this.originAddress = originAddress;
	}

	public String getOriginCity() {
		return originCity;
	}

	public void setOriginCity(String originCity) {
		this.originCity = originCity;
	}

	public String getOriginState() {
		return originState;
	}

	public void setOriginState(String originState) {
		this.originState = originState;
	}

	public String getOriginZip() {
		return originZip;
	}

	public void setOriginZip(String originZip) {
		this.originZip = originZip;
	}

	public String getPackageType() {
		return packageType;
	}

	public void setPackageType(String packageType) {
		this.packageType = packageType;
	}

	public String getPartNum() {
		return partNum;
	}

	public void setPartNum(String partNum) {
		this.partNum = partNum;
	}

	public String getPartDescription() {
		return partDescription;
	}

	public void setPartDescription(String partDescription) {
		this.partDescription = partDescription;
	}

	public String getQuantity() {
		return quantity;
	}

	public void setQuantity(String quantity) {
		this.quantity = quantity;
	}

	public String getShipDate() {
		return shipDate;
	}

	public void setShipDate(String shipDate) {
		this.shipDate = shipDate;
	}

	public String getWeight() {
		return weight;
	}
 
	public String getAdhocOrderId() {
		return adhocOrderId;
	}

	public void setAdhocOrderId(String adhocOrderId) {
		this.adhocOrderId = adhocOrderId;
	}

	public void setWeight(String weight) {
		this.weight = weight;
	}
	
	
	
	
	
	

}
