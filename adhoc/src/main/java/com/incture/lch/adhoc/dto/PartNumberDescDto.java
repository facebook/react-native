package com.incture.lch.adhoc.dto;

public class PartNumberDescDto {

	private String partNum;
	private String partDesc;
	private String message;
	private Boolean isHazMat;
	private String hazardUnNumber;

	public PartNumberDescDto() {

	}

	public PartNumberDescDto(String partNum, String partDesc, String message, Boolean isHazMat, String hazardUnNumber) {
		super();
		this.partNum = partNum;
		this.partDesc = partDesc;
		this.message = message;
		this.isHazMat = isHazMat;
		this.hazardUnNumber = hazardUnNumber;
	}

	public String getPartNum() {
		return partNum;
	}

	public void setPartNum(String partNum) {
		this.partNum = partNum;
	}

	public String getPartDesc() {
		return partDesc;
	}

	public void setPartDesc(String partDesc) {
		this.partDesc = partDesc;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public Boolean getIsHazMat() {
		return isHazMat;
	}

	public void setIsHazMat(Boolean isHazMat) {
		this.isHazMat = isHazMat;
	}

	public String getHazardUnNumber() {
		return hazardUnNumber;
	}

	public void setHazardUnNumber(String hazardUnNumber) {
		this.hazardUnNumber = hazardUnNumber;
	}

}
