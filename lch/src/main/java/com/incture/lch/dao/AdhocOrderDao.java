package com.incture.lch.dao;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.incture.lch.dto.AdhocOrderDto;
import com.incture.lch.entity.AdhocOrders;
import com.incture.lch.util.ServiceUtil;

@Repository("adhocOrderDao")
public class AdhocOrderDao {

	private static final Logger LOGGER = LoggerFactory.getLogger(AdhocOrderWorkflowDao.class);

	@Autowired
	private SessionFactory sessionFactory;

	public void setSessionFactory(SessionFactory sf) {
		this.sessionFactory = sf;
	}

	public AdhocOrderDto exportAdhocOrdersDto(AdhocOrders adhocOrders) {
		AdhocOrderDto AdhocOrderDto = new AdhocOrderDto();

		// System.out.println("Inside DTO CLass");
		AdhocOrderDto.setAdhocOrderId(adhocOrders.getFwoNum());
		AdhocOrderDto.setBusinessDivision(adhocOrders.getBusinessDivision());
		if (adhocOrders.getCharge() != null) {
			AdhocOrderDto.setCharge(ServiceUtil.convertStringToBoolean(adhocOrders.getCharge()));
		}

		AdhocOrderDto.setUserId(adhocOrders.getUserId());
		AdhocOrderDto.setPartNum(adhocOrders.getPartNum());
		AdhocOrderDto.setCreatedBy(adhocOrders.getCreatedBy());
		if (adhocOrders.getCreatedDate() != null && !(adhocOrders.getCreatedDate().equals(""))) {
			AdhocOrderDto.setCreatedDate(ServiceUtil.convertDateToString(adhocOrders.getCreatedDate()));
		}
		AdhocOrderDto.setUpdatedBy(adhocOrders.getUpdatedBy());
		if (adhocOrders.getUpdatedDate() != null && !(adhocOrders.getUpdatedDate().equals(""))) {
			AdhocOrderDto.setUpdatedDate(ServiceUtil.convertDateToString(adhocOrders.getUpdatedDate()));
		}
		AdhocOrderDto.setOriginAddress(adhocOrders.getOriginAddress());
		AdhocOrderDto.setDestinationAddress(adhocOrders.getDestinationAddress());
		if (adhocOrders.getShipDate() != null && !(adhocOrders.getShipDate().equals(""))) {
			AdhocOrderDto.setShipDate(ServiceUtil.convertDateToString(adhocOrders.getShipDate()));
		}
		if (adhocOrders.getExpectedDeliveryDate() != null && !(adhocOrders.getExpectedDeliveryDate().equals(""))) {
			AdhocOrderDto
					.setExpectedDeliveryDate(ServiceUtil.convertDateToString(adhocOrders.getExpectedDeliveryDate()));
		}
		/////
		AdhocOrderDto.setPartDescription(adhocOrders.getPartDescription());
		AdhocOrderDto.setQuantity(adhocOrders.getQuantity());
		// AdhocOrderDto.setQuantity(ServiceUtil.convertIntegerToString(adhocOrders.getQuantity()));

		AdhocOrderDto.setUom(adhocOrders.getUom());
		if (adhocOrders.getIsInternational() != null) {
			// AdhocOrderDto.setIsInternational(ServiceUtil.convertStringToBoolean(adhocOrders.getIsInternational()));
			AdhocOrderDto.setIsInternational(adhocOrders.getIsInternational());

		}
		AdhocOrderDto.setCountryOrigin(adhocOrders.getCountryOrigin());
		AdhocOrderDto.setValue(adhocOrders.getValue());
		AdhocOrderDto.setCurrency(adhocOrders.getCurrency());
		// AdhocOrderDto.setWeight(adhocOrders.getWeight());
		// AdhocOrderDto.setDimensionB(ServiceUtil.convertBigDecimalToString(adhocOrders.getWeight()));
		AdhocOrderDto.setDimensionB(adhocOrders.getWeight());

		if (adhocOrders.getDimensionB() != null) {
			/*
			 * AdhocOrderDto.setDimensionB(ServiceUtil.convertBigDecimalToString
			 * (adhocOrders.getDimensionB()));
			 */ AdhocOrderDto.setDimensionB(adhocOrders.getDimensionB());

		}
		if (adhocOrders.getDimensionH() != null) {
			// AdhocOrderDto.setDimensionH(ServiceUtil.convertBigDecimalToString(adhocOrders.getDimensionH()));
			AdhocOrderDto.setDimensionH(adhocOrders.getDimensionH());

		}
		if (adhocOrders.getDimensionL() != null) {
			// AdhocOrderDto.setDimensionL(ServiceUtil.convertBigDecimalToString(adhocOrders.getDimensionL()));
			AdhocOrderDto.setDimensionL(adhocOrders.getDimensionL());

		}
		AdhocOrderDto.setHazmatNumber(adhocOrders.getHazmatNumber());
		AdhocOrderDto.setProjectNumber(adhocOrders.getProjectNumber());
		AdhocOrderDto.setReferenceNumber(adhocOrders.getReferenceNumber());
		if (adhocOrders.getIsTruck() != null) {
			// AdhocOrderDto.setIsTruck(ServiceUtil.convertStringToBoolean(adhocOrders.getIsTruck()));
			AdhocOrderDto.setIsTruck(adhocOrders.getIsTruck());

		}
		AdhocOrderDto.setVinNumber(adhocOrders.getVinNumber());
		AdhocOrderDto.setShippingInstruction(adhocOrders.getShippingInstruction());
		AdhocOrderDto.setShippingContact(adhocOrders.getShippingContact());
		AdhocOrderDto.setReceivingContact(adhocOrders.getReceivingContact());
		AdhocOrderDto.setPODataNumber(adhocOrders.getPODataNumber());
		AdhocOrderDto.setCustomerOrderNo(adhocOrders.getCustomerOrderNo());
		AdhocOrderDto.setTerms(adhocOrders.getTerms());
		AdhocOrderDto.setPackageType(adhocOrders.getPackageType());
		if (adhocOrders.getPremiumFreight() != null) {
			AdhocOrderDto.setPremiumFreight(ServiceUtil.convertStringToBoolean(adhocOrders.getPremiumFreight()));
		}
		AdhocOrderDto.setReasonCode(adhocOrders.getReasonCode());
		AdhocOrderDto.setGlcode(adhocOrders.getGlCode());
		AdhocOrderDto.setDestinationAddress(adhocOrders.getDestinationAddress());
		AdhocOrderDto.setDestinationCity(adhocOrders.getDestinationCity());
		AdhocOrderDto.setDestinationName(adhocOrders.getDestinationName());
		AdhocOrderDto.setDestinationState(adhocOrders.getDestinationState());
		AdhocOrderDto.setDestinationZip(adhocOrders.getDestinationZip());
		AdhocOrderDto.setShipperName(adhocOrders.getShipperName());
		AdhocOrderDto.setOriginCity(adhocOrders.getOriginCity());
		AdhocOrderDto.setOriginState(adhocOrders.getOriginState());
		AdhocOrderDto.setOriginZip(adhocOrders.getOriginZip());

		if (adhocOrders.getIsHazmat() != null) {
			// AdhocOrderDto.setIsHazmat(ServiceUtil.convertStringToBoolean(adhocOrders.getIsHazmat()));
			AdhocOrderDto.setIsHazmat(adhocOrders.getIsHazmat());

		}
		AdhocOrderDto.setShipperNameFreeText(adhocOrders.getShipperNameFreeText());
		AdhocOrderDto.setOriginCountry(adhocOrders.getOriginCountry());
		AdhocOrderDto.setDestinationNameFreeText(adhocOrders.getDestinationNameFreeText());
		AdhocOrderDto.setDestinationCountry(adhocOrders.getDestinationCountry());
		AdhocOrderDto.setHazmatUn(adhocOrders.getHazmatUn());
		AdhocOrderDto.setWeightUom(adhocOrders.getWeightUom());
		AdhocOrderDto.setDimensionsUom(adhocOrders.getDimensionsUom());

		AdhocOrderDto.setShipperNameDesc(adhocOrders.getShipperNameDesc());
		AdhocOrderDto.setDestinationNameDesc(adhocOrders.getDestinationNameDesc());
		AdhocOrderDto.setUserName(adhocOrders.getUserName());
		AdhocOrderDto.setUserEmail(adhocOrders.getUserEmail());
		AdhocOrderDto.setPremiumReasonCode(adhocOrders.getPremiumReasonCode());
		AdhocOrderDto.setPlannerEmail(adhocOrders.getPlannerEmail());
		AdhocOrderDto.setAdhocType(adhocOrders.getAdhocType());
		AdhocOrderDto.setStatus(adhocOrders.getStatus());
		AdhocOrderDto.setPendingWith(adhocOrders.getPendingWith());
		AdhocOrderDto.setManagerEmail(adhocOrders.getManagerEmail());
		AdhocOrderDto.setIsSaved(adhocOrders.getIsSaved());
		// System.out.println("End of DTO CLass");

		return AdhocOrderDto;
	}

	public AdhocOrders importAdhocOrdersDto(AdhocOrderDto AdhocOrderDto) {
		AdhocOrders adhocOrders = new AdhocOrders();

		adhocOrders.setFwoNum(AdhocOrderDto.getAdhocOrderId());
		adhocOrders.setPartNum(AdhocOrderDto.getPartNum());
		adhocOrders.setUserId(AdhocOrderDto.getUserId());
		adhocOrders.setCreatedBy(AdhocOrderDto.getCreatedBy());
		adhocOrders.setUpdatedBy(AdhocOrderDto.getUpdatedBy());
		if (AdhocOrderDto.getCreatedDate() != null && !(AdhocOrderDto.getCreatedDate().equals(""))) {
			adhocOrders.setCreatedDate(ServiceUtil.convertStringToDate(AdhocOrderDto.getCreatedDate()));
		}
		if (AdhocOrderDto.getUpdatedDate() != null && !(AdhocOrderDto.getUpdatedDate().equals(""))) {
			adhocOrders.setUpdatedDate(ServiceUtil.convertStringToDate(AdhocOrderDto.getUpdatedDate()));
		}
		adhocOrders.setOriginAddress(AdhocOrderDto.getOriginAddress());
		adhocOrders.setDestinationAddress(AdhocOrderDto.getDestinationAddress());
		if (AdhocOrderDto.getShipDate() != null && !(AdhocOrderDto.getShipDate().equals(""))) {
			adhocOrders.setShipDate(ServiceUtil.convertStringToDate(AdhocOrderDto.getShipDate()));
		}
		if (AdhocOrderDto.getExpectedDeliveryDate() != null && !(AdhocOrderDto.getExpectedDeliveryDate().equals(""))) {
			adhocOrders
					.setExpectedDeliveryDate(ServiceUtil.convertStringToDate(AdhocOrderDto.getExpectedDeliveryDate()));
		}
		adhocOrders.setPartDescription(AdhocOrderDto.getPartDescription());
		adhocOrders.setQuantity(AdhocOrderDto.getQuantity());
		// adhocOrders.setQuantity(ServiceUtil.convertStringToInteger(AdhocOrderDto.getQuantity()));

		adhocOrders.setUom(AdhocOrderDto.getUom());
		if (AdhocOrderDto.getIsInternational() != null) {
			// adhocOrders.setIsInternational(ServiceUtil.convertBooleanToString(AdhocOrderDto.getIsInternational()));
			adhocOrders.setIsInternational(AdhocOrderDto.getIsInternational());

		}

		if (AdhocOrderDto.getIsTruck() != null) {
			// adhocOrders.setIsTruck(ServiceUtil.convertBooleanToString(AdhocOrderDto.getIsTruck()));
			adhocOrders.setIsTruck(AdhocOrderDto.getIsTruck());

		}
		adhocOrders.setCountryOrigin(AdhocOrderDto.getCountryOrigin());
		adhocOrders.setValue(AdhocOrderDto.getValue());
		adhocOrders.setCurrency(AdhocOrderDto.getCurrency());
		// adhocOrders.setWeight(ServiceUtil.convertStringToBigDecimal(AdhocOrderDto.getWeight()));
		adhocOrders.setWeight(AdhocOrderDto.getWeight());

		if (AdhocOrderDto.getDimensionB() != null && !(AdhocOrderDto.getDimensionB().equals(""))) {
			// adhocOrders.setDimensionB(ServiceUtil.convertStringToBigDecimal(AdhocOrderDto.getDimensionB()));
			adhocOrders.setDimensionB(AdhocOrderDto.getDimensionB());

		}

		if (AdhocOrderDto.getDimensionH() != null && !(AdhocOrderDto.getDimensionH().equals(""))) {
			// adhocOrders.setDimensionH(ServiceUtil.convertStringToBigDecimal(AdhocOrderDto.getDimensionH()));
			adhocOrders.setDimensionH(AdhocOrderDto.getDimensionH());

		}

		if (AdhocOrderDto.getDimensionL() != null && !(AdhocOrderDto.getDimensionL().equals(""))) {
			// adhocOrders.setDimensionL(ServiceUtil.convertStringToBigDecimal(AdhocOrderDto.getDimensionL()));
			adhocOrders.setDimensionL(AdhocOrderDto.getDimensionL());

		}
		adhocOrders.setHazmatNumber(AdhocOrderDto.getHazmatNumber());
		adhocOrders.setProjectNumber(AdhocOrderDto.getProjectNumber());
		adhocOrders.setReferenceNumber(AdhocOrderDto.getReferenceNumber());
		adhocOrders.setBusinessDivision(AdhocOrderDto.getBusinessDivision());
		if (AdhocOrderDto.getCharge() != null) {
			adhocOrders.setCharge(ServiceUtil.convertBooleanToString(AdhocOrderDto.getCharge()));
		}
		adhocOrders.setVinNumber(AdhocOrderDto.getVinNumber());
		adhocOrders.setShippingInstruction(AdhocOrderDto.getShippingInstruction());
		adhocOrders.setShippingContact(AdhocOrderDto.getShippingContact());
		adhocOrders.setReceivingContact(AdhocOrderDto.getReceivingContact());
		adhocOrders.setPODataNumber(AdhocOrderDto.getPODataNumber());
		adhocOrders.setCustomerOrderNo(AdhocOrderDto.getCustomerOrderNo());
		adhocOrders.setTerms(AdhocOrderDto.getTerms());
		adhocOrders.setPackageType(AdhocOrderDto.getPackageType());
		if (AdhocOrderDto.getCharge() != null) {
			adhocOrders.setPremiumFreight(ServiceUtil.convertBooleanToString(AdhocOrderDto.getPremiumFreight()));
		}
		adhocOrders.setReasonCode(AdhocOrderDto.getReasonCode());
		adhocOrders.setGlCode(AdhocOrderDto.getGlcode());
		adhocOrders.setDestinationCity(AdhocOrderDto.getDestinationCity());
		adhocOrders.setDestinationName(AdhocOrderDto.getDestinationName());
		adhocOrders.setDestinationState(AdhocOrderDto.getDestinationState());
		adhocOrders.setDestinationZip(AdhocOrderDto.getDestinationZip());

		adhocOrders.setShipperName(AdhocOrderDto.getShipperName());
		adhocOrders.setOriginCity(AdhocOrderDto.getOriginCity());
		adhocOrders.setOriginState(AdhocOrderDto.getOriginState());
		adhocOrders.setOriginZip(AdhocOrderDto.getOriginZip());

		if (AdhocOrderDto.getIsHazmat() != null) {
			// adhocOrders.setIsHazmat(ServiceUtil.convertBooleanToString(AdhocOrderDto.getIsHazmat()));

			adhocOrders.setIsHazmat(AdhocOrderDto.getIsHazmat());

		}
		adhocOrders.setShipperNameFreeText(AdhocOrderDto.getShipperNameFreeText());
		adhocOrders.setOriginCountry(AdhocOrderDto.getOriginCountry());
		adhocOrders.setDestinationNameFreeText(AdhocOrderDto.getDestinationNameFreeText());
		adhocOrders.setDestinationCountry(AdhocOrderDto.getDestinationCountry());
		adhocOrders.setHazmatUn(AdhocOrderDto.getHazmatUn());
		adhocOrders.setWeightUom(AdhocOrderDto.getWeightUom());
		adhocOrders.setDimensionsUom(AdhocOrderDto.getDimensionsUom());

		adhocOrders.setShipperNameDesc(AdhocOrderDto.getShipperNameDesc());
		adhocOrders.setDestinationNameDesc(AdhocOrderDto.getDestinationNameDesc());
		adhocOrders.setUserName(AdhocOrderDto.getUserName());
		adhocOrders.setUserEmail(AdhocOrderDto.getUserEmail());
		adhocOrders.setPremiumReasonCode(AdhocOrderDto.getPremiumReasonCode());
		adhocOrders.setPlannerEmail(AdhocOrderDto.getPlannerEmail());
		adhocOrders.setAdhocType(AdhocOrderDto.getAdhocType());
		adhocOrders.setStatus(AdhocOrderDto.getStatus());
		adhocOrders.setPendingWith(AdhocOrderDto.getPendingWith());
		adhocOrders.setManagerEmail(AdhocOrderDto.getManagerEmail());
		adhocOrders.setIsSaved(AdhocOrderDto.getIsSaved());
		return adhocOrders;
	}

	public void saveOrUpdateAdhocOrder(AdhocOrderDto orderDto) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		session.saveOrUpdate(importAdhocOrdersDto(orderDto));
		session.flush();
		session.clear();
		tx.commit();
		session.close();
	}

}
