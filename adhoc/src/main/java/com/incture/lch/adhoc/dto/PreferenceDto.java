package com.incture.lch.adhoc.dto;

public class PreferenceDto {
	private String preferenceId;
	

	private String columnName;
	private Boolean isVisible;
	private Boolean isMandatory;
	private Boolean isEditable;
	private int sequenceHistory;
	private int sequence;
	public String getPreferenceId() {
		return preferenceId;
	}

	public void setPreferenceId(String preferenceId) {
		this.preferenceId = preferenceId;
	}
	public String getColumnName() {
		return columnName;
	}

	public void setColumnName(String columnName) {
		this.columnName = columnName;
	}

	public Boolean getIsVisible() {
		return isVisible;
	}

	public void setIsVisible(Boolean isVisible) {
		this.isVisible = isVisible;
	}

	public Boolean getIsMandatory() {
		return isMandatory;
	}

	public void setIsMandatory(Boolean isMandatory) {
		this.isMandatory = isMandatory;
	}

	public Boolean getIsEditable() {
		return isEditable;
	}

	public void setIsEditable(Boolean isEditable) {
		this.isEditable = isEditable;
	}

	public int getSequenceHistory() {
		return sequenceHistory;
	}

	public void setSequenceHistory(int sequenceHistory) {
		this.sequenceHistory = sequenceHistory;
	}

	public int getSequence() {
		return sequence;
	}

	public void setSequence(int sequence) {
		this.sequence = sequence;
	}

}
