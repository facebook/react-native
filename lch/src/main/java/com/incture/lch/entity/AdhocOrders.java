package com.incture.lch.entity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

@Entity
@Table(name = "T_ADHOC_ORDER")
public class AdhocOrders implements Serializable {

	private static final long serialVersionUID = -6619380688974543624L;

	@Id
	@Column(name = "adhocOrderId")
	private String fwoNum;

	@Column(name = "userId")
	private String userId;

	@Column(name = "partNum")
	private String partNum;

	@Column(name = "createdBy")
	private String createdBy;

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "createdDate")
	private Date createdDate;

	@Column(name = "updatedBy")
	private String updatedBy;

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "updatedDate")
	private Date updatedDate;

	@Column(name = "originAddress")
	private String originAddress;

	@Column(name = "destinationAddress")
	private String destinationAddress;

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "shipDate")
	private Date shipDate;

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "expectedDeliveryDate")
	private Date expectedDeliveryDate;

	@Column(name = "partDescription")
	private String partDescription;

	@Column(name = "quantity")
	private int quantity;

	@Column(name = "uom")
	private String uom;

	@Column(name = "isInternational")
	private Boolean isInternational;

	@Column(name = "countryOrigin")
	private String countryOrigin;

	@Column(name = "value")
	private String value;

	@Column(name = "currency")
	private String currency;

	@Column(name = "weight", precision = 25, scale = 2)
	private BigDecimal weight;

	@Column(name = "dimensionL", precision = 25, scale = 6)
	private BigDecimal dimensionL;

	@Column(name = "dimensionH", precision = 25, scale = 6)
	private BigDecimal dimensionH;

	@Column(name = "dimensionB", precision = 25, scale = 6)
	private BigDecimal dimensionB;

	@Column(name = "hazmatNumber")
	private String hazmatNumber;

	@Column(name = "projectNumber")
	private String projectNumber;

	@Column(name = "referenceNumber")
	private String referenceNumber;

	@Column(name = "businessDivision")
	private String businessDivision;

	@Column(name = "charge")
	private String charge;

	@Column(name = "isTruck")
	private Boolean isTruck;

	@Column(name = "vinNumber")
	private String vinNumber;

	@Column(name = "shippingInstruction")
	private String shippingInstruction;

	@Column(name = "shippingContact")
	private String shippingContact;

	@Column(name = "receivingContact")
	private String receivingContact;

	@Column(name = "podataNumber")
	private String PODataNumber;

	@Column(name = "customerOrderNo")
	private String customerOrderNo;

	@Column(name = "terms")
	private String terms;

	@Column(name = "packageType")
	private String packageType;

	@Column(name = "premiumFreight")
	private String premiumFreight;

	@Column(name = "reasonCode")
	private String reasonCode;

	@Column(name = "glCode")
	private String glCode;

	@Column(name = "shipperName")
	private String shipperName;

	@Column(name = "originCity")
	private String originCity;

	@Column(name = "originState")
	private String originState;

	@Column(name = "originZip")
	private String originZip;

	@Column(name = "destinationName")
	private String destinationName;

	@Column(name = "destinationCity")
	private String destinationCity;

	@Column(name = "destinationState")
	private String destinationState;

	@Column(name = "destinationZip")
	private String destinationZip;

	@Column(name = "isHazmat")
	private Boolean isHazmat;

	@Column(name = "shipperNameFreeText")
	private String shipperNameFreeText;

	@Column(name = "destinationNameFreeText")
	private String destinationNameFreeText;

	@Column(name = "originCountry")
	private String originCountry;

	@Column(name = "destinationCountry")
	private String destinationCountry;

	@Column(name = "hazmatUn")
	private String hazmatUn;

	@Column(name = "weightUom")
	private String weightUom;

	@Column(name = "dimensionsUom")
	private String dimensionsUom;

	@Column(name = "shipperNameDesc")
	private String shipperNameDesc;

	@Column(name = "destinationNameDesc")
	private String destinationNameDesc;

	@Column(name = "USERNAME")
	private String userName;

	@Column(name = "USEREMAIL")
	private String userEmail;

	@Column(name = "PREMIUMREASONCODE")
	private String premiumReasonCode;

	@Column(name = "PLANNEREMAIL")
	private String plannerEmail;

	@Column(name = "ADHOC_TYPE")
	private String adhocType;

	@Column(name = "MANAGER_EMAIL")
	private String managerEmail;

	@Column(name = "APPROVED")
	private Boolean approved;

	@Column(name = "APPROVED_BY")
	private String approvedBy;

	@Column(name = "APPROVED_DATE")
	@Temporal(TemporalType.TIMESTAMP)
	private Date approvedDate;

	@Column(name = "STATUS")
	private String status;

	@Column(name = "PENDING_WITH")
	private String pendingWith;

	@Column(name = "IS_SAVED")
	private Boolean isSaved;

	public String getFwoNum() {
		return fwoNum;
	}

	public void setFwoNum(String fwoNum) {
		this.fwoNum = fwoNum;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getPartNum() {
		return partNum;
	}

	public void setPartNum(String partNum) {
		this.partNum = partNum;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	public Date getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(Date createdDate) {
		this.createdDate = createdDate;
	}

	public String getUpdatedBy() {
		return updatedBy;
	}

	public void setUpdatedBy(String updatedBy) {
		this.updatedBy = updatedBy;
	}

	public Date getUpdatedDate() {
		return updatedDate;
	}

	public void setUpdatedDate(Date updatedDate) {
		this.updatedDate = updatedDate;
	}

	public String getOriginAddress() {
		return originAddress;
	}

	public void setOriginAddress(String originAddress) {
		this.originAddress = originAddress;
	}

	public String getDestinationAddress() {
		return destinationAddress;
	}

	public void setDestinationAddress(String destinationAddress) {
		this.destinationAddress = destinationAddress;
	}

	public Date getShipDate() {
		return shipDate;
	}

	public void setShipDate(Date shipDate) {
		this.shipDate = shipDate;
	}

	public Date getExpectedDeliveryDate() {
		return expectedDeliveryDate;
	}

	public void setExpectedDeliveryDate(Date expectedDeliveryDate) {
		this.expectedDeliveryDate = expectedDeliveryDate;
	}

	public String getPartDescription() {
		return partDescription;
	}

	public void setPartDescription(String partDescription) {
		this.partDescription = partDescription;
	}

	public int getQuantity() {
		return quantity;
	}

	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}

	public String getUom() {
		return uom;
	}

	public void setUom(String uom) {
		this.uom = uom;
	}

	public Boolean getIsInternational() {
		return isInternational;
	}

	public void setIsInternational(Boolean isInternational) {
		this.isInternational = isInternational;
	}

	public String getCountryOrigin() {
		return countryOrigin;
	}

	public void setCountryOrigin(String countryOrigin) {
		this.countryOrigin = countryOrigin;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public BigDecimal getWeight() {
		return weight;
	}

	public void setWeight(BigDecimal weight) {
		this.weight = weight;
	}

	public BigDecimal getDimensionL() {
		return dimensionL;
	}

	public void setDimensionL(BigDecimal dimensionL) {
		this.dimensionL = dimensionL;
	}

	public BigDecimal getDimensionH() {
		return dimensionH;
	}

	public void setDimensionH(BigDecimal dimensionH) {
		this.dimensionH = dimensionH;
	}

	public BigDecimal getDimensionB() {
		return dimensionB;
	}

	public void setDimensionB(BigDecimal dimensionB) {
		this.dimensionB = dimensionB;
	}

	public String getHazmatNumber() {
		return hazmatNumber;
	}

	public void setHazmatNumber(String hazmatNumber) {
		this.hazmatNumber = hazmatNumber;
	}

	public String getProjectNumber() {
		return projectNumber;
	}

	public void setProjectNumber(String projectNumber) {
		this.projectNumber = projectNumber;
	}

	public String getReferenceNumber() {
		return referenceNumber;
	}

	public void setReferenceNumber(String referenceNumber) {
		this.referenceNumber = referenceNumber;
	}

	public String getBusinessDivision() {
		return businessDivision;
	}

	public void setBusinessDivision(String businessDivision) {
		this.businessDivision = businessDivision;
	}

	public String getCharge() {
		return charge;
	}

	public void setCharge(String charge) {
		this.charge = charge;
	}

	public Boolean getIsTruck() {
		return isTruck;
	}

	public void setIsTruck(Boolean isTruck) {
		this.isTruck = isTruck;
	}

	public String getVinNumber() {
		return vinNumber;
	}

	public void setVinNumber(String vinNumber) {
		this.vinNumber = vinNumber;
	}

	public String getShippingInstruction() {
		return shippingInstruction;
	}

	public void setShippingInstruction(String shippingInstruction) {
		this.shippingInstruction = shippingInstruction;
	}

	public String getShippingContact() {
		return shippingContact;
	}

	public void setShippingContact(String shippingContact) {
		this.shippingContact = shippingContact;
	}

	public String getReceivingContact() {
		return receivingContact;
	}

	public void setReceivingContact(String receivingContact) {
		this.receivingContact = receivingContact;
	}

	public String getPODataNumber() {
		return PODataNumber;
	}

	public void setPODataNumber(String pODataNumber) {
		PODataNumber = pODataNumber;
	}

	public String getCustomerOrderNo() {
		return customerOrderNo;
	}

	public void setCustomerOrderNo(String customerOrderNo) {
		this.customerOrderNo = customerOrderNo;
	}

	public String getTerms() {
		return terms;
	}

	public void setTerms(String terms) {
		this.terms = terms;
	}

	public String getPackageType() {
		return packageType;
	}

	public void setPackageType(String packageType) {
		this.packageType = packageType;
	}

	public String getPremiumFreight() {
		return premiumFreight;
	}

	public void setPremiumFreight(String premiumFreight) {
		this.premiumFreight = premiumFreight;
	}

	public String getReasonCode() {
		return reasonCode;
	}

	public void setReasonCode(String reasonCode) {
		this.reasonCode = reasonCode;
	}

	public String getGlCode() {
		return glCode;
	}

	public void setGlCode(String glCode) {
		this.glCode = glCode;
	}

	public String getShipperName() {
		return shipperName;
	}

	public void setShipperName(String shipperName) {
		this.shipperName = shipperName;
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

	public String getDestinationName() {
		return destinationName;
	}

	public void setDestinationName(String destinationName) {
		this.destinationName = destinationName;
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

	public Boolean getIsHazmat() {
		return isHazmat;
	}

	public void setIsHazmat(Boolean isHazmat) {
		this.isHazmat = isHazmat;
	}

	public String getShipperNameFreeText() {
		return shipperNameFreeText;
	}

	public void setShipperNameFreeText(String shipperNameFreeText) {
		this.shipperNameFreeText = shipperNameFreeText;
	}

	public String getDestinationNameFreeText() {
		return destinationNameFreeText;
	}

	public void setDestinationNameFreeText(String destinationNameFreeText) {
		this.destinationNameFreeText = destinationNameFreeText;
	}

	public String getOriginCountry() {
		return originCountry;
	}

	public void setOriginCountry(String originCountry) {
		this.originCountry = originCountry;
	}

	public String getDestinationCountry() {
		return destinationCountry;
	}

	public void setDestinationCountry(String destinationCountry) {
		this.destinationCountry = destinationCountry;
	}

	public String getHazmatUn() {
		return hazmatUn;
	}

	public void setHazmatUn(String hazmatUn) {
		this.hazmatUn = hazmatUn;
	}

	public String getWeightUom() {
		return weightUom;
	}

	public void setWeightUom(String weightUom) {
		this.weightUom = weightUom;
	}

	public String getDimensionsUom() {
		return dimensionsUom;
	}

	public void setDimensionsUom(String dimensionsUom) {
		this.dimensionsUom = dimensionsUom;
	}

	public String getShipperNameDesc() {
		return shipperNameDesc;
	}

	public void setShipperNameDesc(String shipperNameDesc) {
		this.shipperNameDesc = shipperNameDesc;
	}

	public String getDestinationNameDesc() {
		return destinationNameDesc;
	}

	public void setDestinationNameDesc(String destinationNameDesc) {
		this.destinationNameDesc = destinationNameDesc;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getUserEmail() {
		return userEmail;
	}

	public void setUserEmail(String userEmail) {
		this.userEmail = userEmail;
	}

	public String getPremiumReasonCode() {
		return premiumReasonCode;
	}

	public void setPremiumReasonCode(String premiumReasonCode) {
		this.premiumReasonCode = premiumReasonCode;
	}

	public String getPlannerEmail() {
		return plannerEmail;
	}

	public void setPlannerEmail(String plannerEmail) {
		this.plannerEmail = plannerEmail;
	}

	public String getAdhocType() {
		return adhocType;
	}

	public void setAdhocType(String adhocType) {
		this.adhocType = adhocType;
	}

	public String getManagerEmail() {
		return managerEmail;
	}

	public void setManagerEmail(String managerEmail) {
		this.managerEmail = managerEmail;
	}

	public Boolean getApproved() {
		return approved;
	}

	public void setApproved(Boolean approved) {
		this.approved = approved;
	}

	public String getApprovedBy() {
		return approvedBy;
	}

	public void setApprovedBy(String approvedBy) {
		this.approvedBy = approvedBy;
	}

	public Date getApprovedDate() {
		return approvedDate;
	}

	public void setApprovedDate(Date approvedDate) {
		this.approvedDate = approvedDate;
	}

	public static long getSerialversionuid() {
		return serialVersionUID;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getPendingWith() {
		return pendingWith;
	}

	public void setPendingWith(String pendingWith) {
		this.pendingWith = pendingWith;
	}

	public Boolean getIsSaved() {
		return isSaved;
	}

	public void setIsSaved(Boolean isSaved) {
		this.isSaved = isSaved;
	}

	

}
