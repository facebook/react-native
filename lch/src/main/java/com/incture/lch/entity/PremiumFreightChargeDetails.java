package com.incture.lch.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name= "T_PREMIUM_FREIGHT_CHARGE_DETAILS")
public class PremiumFreightChargeDetails 
{
	@Id
	@Column(name="ID")
	//@GeneratedValue(strategy = GenerationType.AUTO)
	@GeneratedValue(generator="system-uuid")
	@GenericGenerator(name="system-uuid", strategy = "uuid")
	private String premiumId;
	
	@Column(name="ADHOC_ORDER_ID")
	private String adhocOrderId;
	
	//ORIGIN DETAILS
	@Column(name="ORIGIN_NAME")
	private String originName;
	
	@Column(name="ORIGIN_ADDRESS")
	private String originAddress;
	
	@Column(name="ORIGIN_CITY")
	private String originCity;
	
	@Column(name="ORIGIN_STATE")
	private String originState;
	
	@Column(name="ORIGIN_ZIP")
	private String originZip;
	
	@Column(name="ORIGIN_COUNTRY")
	private String originCountry;
	
    //Destination Details
	
	@Column(name="DESTINATION_NAME")
	private String destinationName;
	
	@Column(name="DESTINATION_ADDERSS")
	private String destinationAdress;
	
	@Column(name="DESTINATION_CITY")
	private String destinationCity;
	
	@Column(name="DESTINATION_STATE")
	private String destinationState;
	
	@Column(name="DESTINATION_ZIP")
	private String destinationZip;
	
	@Column(name="DESTINATION_COUNTRY")
	private String destinationCountry;
	
	//CARRIER DETAILS
	@Column(name="BP_NUMBER")
	private String bpNumber;
	
	@Column(name="CARRIER_DETAILS")
	private String carrierDetails;
	
	@Column(name="CARRIER_SCAC")
	private String carrierScac;
	
	@Column(name="CARRIER_RATE")
	private String carrierRatePerKM;
	
	@Column(name="CARRIER_MODE")
	private String carrierMode;
	
	//COST DETAILS
	
	@Column(name="CHARGE")
	private int charge;


	//STATUS
	@Column(name="REASON_CODE")
	private String reasonCode;
	@Column(name="STATUS")
	private String Status;
	@Column(name="PLANNER_EMAIL")
	private String plannerEmail;

	public String getAdhocOrderId() {
		return adhocOrderId;
	}

	public String getPremiumId() {
		return premiumId;
	}

	public void setPremiumId(String premiumId) {
		this.premiumId = premiumId;
	}

	public void setAdhocOrderId(String adhocOrderId) {
		this.adhocOrderId = adhocOrderId;
	}

	public String getOriginName() {
		return originName;
	}

	public void setOriginName(String originName) {
		this.originName = originName;
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

	public String getOriginCountry() {
		return originCountry;
	}

	public void setOriginCountry(String originCountry) {
		this.originCountry = originCountry;
	}

	public String getDestinationName() {
		return destinationName;
	}

	public void setDestinationName(String destinationName) {
		this.destinationName = destinationName;
	}

	public String getDestinationAdress() {
		return destinationAdress;
	}

	public void setDestinationAdress(String destinationAdress) {
		this.destinationAdress = destinationAdress;
	}

	public String getDestinationCity() {
		return destinationCity;
	}

	public void setDestinationCity(String destinationCity) {
		this.destinationCity = destinationCity;
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

	public String getDestinationCountry() {
		return destinationCountry;
	}

	public void setDestinationCountry(String destinationCountry) {
		this.destinationCountry = destinationCountry;
	}

	public String getBpNumber() {
		return bpNumber;
	}

	public void setBpNumber(String bpNumber) {
		this.bpNumber = bpNumber;
	}

	public String getCarrierDetails() {
		return carrierDetails;
	}

	public void setCarrierDetails(String carrierDetails) {
		this.carrierDetails = carrierDetails;
	}

	public String getCarrierRatePerKM() {
		return carrierRatePerKM;
	}

	public void setCarrierRatePerKM(String carrierRatePerKM) {
		this.carrierRatePerKM = carrierRatePerKM;
	}

	public int getCharge() {
		return charge;
	}

	public void setCharge(int charge) {
		this.charge = charge;
	}

	public String getStatus() {
		return Status;
	}

	public void setStatus(String status) {
		Status = status;
	}

	public String getCarrierScac() {
		return carrierScac;
	}

	public void setCarrierScac(String carrierScac) {
		this.carrierScac = carrierScac;
	}

	public String getCarrierMode() {
		return carrierMode;
	}

	public void setCarrierMode(String carrierMode) {
		this.carrierMode = carrierMode;
	}

	public String getReasonCode() {
		return reasonCode;
	}

	public void setReasonCode(String reasonCode) {
		this.reasonCode = reasonCode;
	}

	public String getPlannerEmail() {
		return plannerEmail;
	}

	public void setPlannerEmail(String plannerEmail) {
		this.plannerEmail = plannerEmail;
	}
	
	
	
	
	



	
	

	

}
