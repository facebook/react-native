package com.incture.lch.adhoc.repository.implementation;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.criterion.MatchMode;
import org.hibernate.criterion.Restrictions;
import org.hibernate.query.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.incture.lch.adhoc.dao.LkCountriesDao;
import com.incture.lch.adhoc.dao.LkDivisionDao;
import com.incture.lch.adhoc.dao.LkShipperDetailsDao;
import com.incture.lch.adhoc.dto.AdhocOrderDto;
import com.incture.lch.adhoc.dto.AdhocRequestDto;
import com.incture.lch.adhoc.dto.LkCountriesDto;
import com.incture.lch.adhoc.dto.LkDivisionsDto;
import com.incture.lch.adhoc.dto.LkShipperDetailsDto;
import com.incture.lch.adhoc.dto.ReasonCodeDto;
import com.incture.lch.adhoc.dto.ResponseDto;
import com.incture.lch.adhoc.entity.AdhocOrders;
import com.incture.lch.adhoc.entity.LkCountries;
import com.incture.lch.adhoc.entity.LkDivisions;
import com.incture.lch.adhoc.entity.LkShipperDetails;
import com.incture.lch.adhoc.entity.ReasonCode;
import com.incture.lch.adhoc.repository.AdhocOrdersRepository;
import com.incture.lch.adhoc.util.GetReferenceData;
import com.incture.lch.adhoc.util.ServiceUtil;

@Repository
public class AdhocOrdersRepositoryImpl implements AdhocOrdersRepository {

	@Autowired
	// @Qualifier("sessionDb")
	private SessionFactory sessionFactory;

	public void setSessionFactory(SessionFactory sf) {
		this.sessionFactory = sf;
	}

	@Autowired
	GetReferenceData getReferenceData;

	@Autowired
	private LkShipperDetailsDao lkShipperDetailsDao;

	@Autowired
	private LkDivisionDao lkDivDao;

	@Autowired
	private LkCountriesDao lkCouDao;

	@Autowired
	private LkShipperDetailsDao lkShipperDao;

	private static final Logger LOGGER = LoggerFactory.getLogger(AdhocOrdersRepositoryImpl.class);

	/*
	 * public LkShipperDetails importShipperDetails(LkShipperDetailsDto dto) {
	 * LkShipperDetails shipDetDo = new LkShipperDetails();
	 * shipDetDo.setOnetimeLoc(true);
	 * shipDetDo.setShipperCity(dto.getShipperCity());
	 * shipDetDo.setShipperCountry(dto.getShipperCountry());
	 * shipDetDo.setShipperState(dto.getShipperState());
	 * shipDetDo.setShipperName(dto.getShipperName());
	 * shipDetDo.setShipperZip(dto.getShipperZip());
	 * shipDetDo.setShipperContact(dto.getShipperContact());
	 * shipDetDo.setBpNumber(dto.getBpNumber());
	 * shipDetDo.setOnetimeLocId(dto.getOnetimeLocId()); return shipDetDo;
	 * 
	 * }
	 * 
	 * public LkShipperDetailsDto exportShipperDetails(LkShipperDetails shipDo)
	 * { LkShipperDetailsDto shipDetDto = new LkShipperDetailsDto();
	 * shipDetDto.setOnetimeLoc(true);
	 * shipDetDto.setShipperCity(shipDo.getShipperCity());
	 * shipDetDto.setShipperCountry(shipDo.getShipperCountry());
	 * shipDetDto.setShipperState(shipDo.getShipperState());
	 * shipDetDto.setShipperName(shipDo.getShipperName());
	 * shipDetDto.setShipperZip(shipDo.getShipperZip());
	 * shipDetDto.setShipperContact(shipDo.getShipperContact());
	 * shipDetDto.setBpNumber(shipDo.getBpNumber());
	 * shipDetDto.setOnetimeLocId(shipDo.getOnetimeLocId()); return shipDetDto;
	 * 
	 * }
	 */

	public AdhocOrderDto exportAdhocOrdersDto(AdhocOrders adhocOrders) {
		AdhocOrderDto AdhocOrderDto = new AdhocOrderDto();

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
		AdhocOrderDto.setPartDescription(adhocOrders.getPartDescription());
		// AdhocOrderDto.setQuantity(adhocOrders.getQuantity());
		AdhocOrderDto.setQuantity(ServiceUtil.convertIntegerToString(adhocOrders.getQuantity()));

		AdhocOrderDto.setUom(adhocOrders.getUom());
		if (adhocOrders.getIsInternational() != null) {
			// AdhocOrderDto.setIsInternational(ServiceUtil.convertStringToBoolean(adhocOrders.getIsInternational()));
			AdhocOrderDto.setIsInternational(adhocOrders.getIsInternational());

		}
		AdhocOrderDto.setCountryOrigin(adhocOrders.getCountryOrigin());
		AdhocOrderDto.setValue(adhocOrders.getValue());
		AdhocOrderDto.setCurrency(adhocOrders.getCurrency());
		// AdhocOrderDto.setWeight(adhocOrders.getWeight());
		AdhocOrderDto.setDimensionB(ServiceUtil.convertBigDecimalToString(adhocOrders.getWeight()));

		if (adhocOrders.getDimensionB() != null) {
			AdhocOrderDto.setDimensionB(ServiceUtil.convertBigDecimalToString(adhocOrders.getDimensionB()));
		}
		if (adhocOrders.getDimensionH() != null) {
			AdhocOrderDto.setDimensionH(ServiceUtil.convertBigDecimalToString(adhocOrders.getDimensionH()));
		}
		if (adhocOrders.getDimensionL() != null) {
			AdhocOrderDto.setDimensionL(ServiceUtil.convertBigDecimalToString(adhocOrders.getDimensionL()));
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
		// adhocOrders.setQuantity(AdhocOrderDto.getQuantity());
		adhocOrders.setQuantity(ServiceUtil.convertStringToInteger(AdhocOrderDto.getQuantity()));

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
		adhocOrders.setWeight(ServiceUtil.convertStringToBigDecimal(AdhocOrderDto.getWeight()));
		if (AdhocOrderDto.getDimensionB() != null && !(AdhocOrderDto.getDimensionB().equals(""))) {
			adhocOrders.setDimensionB(ServiceUtil.convertStringToBigDecimal(AdhocOrderDto.getDimensionB()));
		}

		if (AdhocOrderDto.getDimensionH() != null && !(AdhocOrderDto.getDimensionH().equals(""))) {
			adhocOrders.setDimensionH(ServiceUtil.convertStringToBigDecimal(AdhocOrderDto.getDimensionH()));
		}

		if (AdhocOrderDto.getDimensionL() != null && !(AdhocOrderDto.getDimensionL().equals(""))) {
			adhocOrders.setDimensionL(ServiceUtil.convertStringToBigDecimal(AdhocOrderDto.getDimensionL()));
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

	public ReasonCodeDto exportReasonCode(ReasonCode reasonCode) {
		ReasonCodeDto reasonCodeDto = new ReasonCodeDto();
		reasonCodeDto.setReasonCodeKey(reasonCode.getReasonCodeKey());
		reasonCodeDto.setReasonCodeValue(reasonCode.getReasonCodeValue());
		return reasonCodeDto;
	}

	public ReasonCode importReasonCode(ReasonCodeDto reasonCodeDto) {
		ReasonCode reasonCode = new ReasonCode();
		reasonCode.setReasonCodeKey(reasonCodeDto.getReasonCodeKey());
		reasonCode.setReasonCodeValue(reasonCodeDto.getReasonCodeValue());
		return reasonCode;
	}

	@SuppressWarnings("unchecked")
	public List<AdhocOrderDto> getAllAdhocOrders() {
		List<AdhocOrderDto> AdhocOrderDtos = new ArrayList<>();
		List<AdhocOrders> adhocOrders = new ArrayList<>();
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		String queryStr = "select ad from AdhocOrders ad Order By fwoNum desc";
		Query query = session.createQuery(queryStr);
		query.setParameter("isOrderSubmitted", true);
		adhocOrders = query.list();
		for (AdhocOrders adOrders : adhocOrders) {
			AdhocOrderDtos.add(exportAdhocOrdersDto(adOrders));
		}
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return AdhocOrderDtos;
	}

	@SuppressWarnings({ "unchecked", "deprecation" })
	public ResponseDto addAdhocOrders(AdhocOrderDto AdhocOrderDto) {
		ResponseDto responseDto = new ResponseDto();
		AdhocOrders adhocOrders = new AdhocOrders();
		adhocOrders = importAdhocOrdersDto(AdhocOrderDto);
		LkShipperDetailsDto shipDetDto = new LkShipperDetailsDto();
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		Criteria crit = session.createCriteria(LkShipperDetails.class);
		crit.add(Restrictions.eq("shipperName", AdhocOrderDto.getShipperName()));

		Criteria crit2 = session.createCriteria(LkShipperDetails.class);
		crit2.add(Restrictions.eq("shipperName", AdhocOrderDto.getDestinationName()));

		// crit.add(Restrictions.like("shipperName", "'" +
		// AdhocOrderDto.getShipperName() + "'", MatchMode.EXACT));
		List<LkShipperDetailsDto> listOfShipper = crit.list();
		List<LkShipperDetailsDto> listOfDestinations = crit2.list();
		if (ServiceUtil.isEmpty(listOfShipper)) {
			shipDetDto.setOnetimeLoc(true);
			shipDetDto.setShipperCity(AdhocOrderDto.getOriginCity());
			shipDetDto.setShipperCountry(AdhocOrderDto.getOriginCountry());
			shipDetDto.setShipperState(AdhocOrderDto.getOriginState());
			shipDetDto.setShipperName(AdhocOrderDto.getShipperName());
			shipDetDto.setShipperZip(AdhocOrderDto.getOriginZip());
			shipDetDto.setShipperContact(AdhocOrderDto.getShippingContact());
			shipDetDto.setBpNumber(ServiceUtil.generateRandomDigits(16));
			shipDetDto.setOnetimeLocId(ServiceUtil.getAlphaNumericString(16));
			session.save(lkShipperDetailsDao.importShipperDetails(shipDetDto));
		}
		if (ServiceUtil.isEmpty(listOfDestinations)) {
			LkShipperDetailsDto shipDetDto2 = new LkShipperDetailsDto();
			shipDetDto2.setOnetimeLoc(true);
			shipDetDto2.setShipperCity(AdhocOrderDto.getDestinationCity());
			shipDetDto2.setShipperCountry(AdhocOrderDto.getDestinationCountry());
			shipDetDto2.setShipperState(AdhocOrderDto.getDestinationState());
			shipDetDto2.setShipperName(AdhocOrderDto.getDestinationName());
			shipDetDto2.setShipperZip(AdhocOrderDto.getDestinationZip());
			shipDetDto2.setShipperContact(AdhocOrderDto.getDestinationAddress());
			shipDetDto2.setBpNumber(ServiceUtil.generateRandomDigits(16));
			shipDetDto2.setOnetimeLocId(ServiceUtil.getAlphaNumericString(16));
			session.save(lkShipperDetailsDao.importShipperDetails(shipDetDto2));
		}

		String adhocOrderId = getReferenceData.getNextSeqNumberAdhoc(
				getReferenceData.executeAdhoc("ADH" + AdhocOrderDto.getShipperName().substring(0, 2)), 5,
				sessionFactory);

		if (adhocOrders.getFwoNum() == null || adhocOrders.getFwoNum().equals("")) {
			adhocOrders.setFwoNum(adhocOrderId);
		
		}

		session.saveOrUpdate(adhocOrders);
		responseDto.setMessage("Save success");
		responseDto.setStatus("SUCCESS");
		responseDto.setCode("00");
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return responseDto;
	}

	@SuppressWarnings({ "unchecked", "deprecation" })
	public ResponseDto saveAdhocOrders(AdhocOrderDto AdhocOrderDto) {
		ResponseDto responseDto = new ResponseDto();
		AdhocOrders adhocOrders = new AdhocOrders();
		adhocOrders = importAdhocOrdersDto(AdhocOrderDto);
		adhocOrders.setIsSaved(true);
		LkShipperDetailsDto shipDetDto = new LkShipperDetailsDto();
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		Criteria crit = session.createCriteria(LkShipperDetails.class);
		crit.add(Restrictions.eq("shipperName", AdhocOrderDto.getShipperName()));

		Criteria crit2 = session.createCriteria(LkShipperDetails.class);
		crit2.add(Restrictions.eq("shipperName", AdhocOrderDto.getDestinationName()));

		// crit.add(Restrictions.like("shipperName", "'" +
		// AdhocOrderDto.getShipperName() + "'", MatchMode.EXACT));
		List<LkShipperDetailsDto> listOfShipper = crit.list();
		List<LkShipperDetailsDto> listOfDestinations = crit2.list();
		if (ServiceUtil.isEmpty(listOfShipper)) {
			shipDetDto.setOnetimeLoc(true);
			shipDetDto.setShipperCity(AdhocOrderDto.getOriginCity());
			shipDetDto.setShipperCountry(AdhocOrderDto.getOriginCountry());
			shipDetDto.setShipperState(AdhocOrderDto.getOriginState());
			shipDetDto.setShipperName(AdhocOrderDto.getShipperName());
			shipDetDto.setShipperZip(AdhocOrderDto.getOriginZip());
			shipDetDto.setShipperContact(AdhocOrderDto.getShippingContact());
			shipDetDto.setBpNumber(ServiceUtil.generateRandomDigits(16));
			shipDetDto.setOnetimeLocId(ServiceUtil.getAlphaNumericString(16));
			session.save(lkShipperDetailsDao.importShipperDetails(shipDetDto));
		}
		if (ServiceUtil.isEmpty(listOfDestinations)) {
			LkShipperDetailsDto shipDetDto2 = new LkShipperDetailsDto();
			shipDetDto2.setOnetimeLoc(true);
			shipDetDto2.setShipperCity(AdhocOrderDto.getDestinationCity());
			shipDetDto2.setShipperCountry(AdhocOrderDto.getDestinationCountry());
			shipDetDto2.setShipperState(AdhocOrderDto.getDestinationState());
			shipDetDto2.setShipperName(AdhocOrderDto.getDestinationName());
			shipDetDto2.setShipperZip(AdhocOrderDto.getDestinationZip());
			shipDetDto2.setShipperContact(AdhocOrderDto.getDestinationAddress());
			shipDetDto2.setBpNumber(ServiceUtil.generateRandomDigits(16));
			shipDetDto2.setOnetimeLocId(ServiceUtil.getAlphaNumericString(16));
			session.save(lkShipperDetailsDao.importShipperDetails(shipDetDto2));
		}

		if (!ServiceUtil.isEmpty(AdhocOrderDto.getAdhocOrderId())) {
			if (AdhocOrderDto.getAdhocOrderId().startsWith("TEM")) {
				adhocOrders.setFwoNum(AdhocOrderDto.getAdhocOrderId().replace("TEM", "ADH"));
			}
		} else {

			String adhocOrderId = getReferenceData.getNextSeqNumberAdhoc(
					getReferenceData.executeAdhoc("TEM" + AdhocOrderDto.getShipperName().substring(0, 2)), 5,
					sessionFactory);
			if (adhocOrders.getFwoNum() == null || adhocOrders.getFwoNum().equals("")) {
				adhocOrders.setFwoNum(adhocOrderId);
			}
		}

		session.saveOrUpdate(adhocOrders);
		responseDto.setMessage("Save success");
		responseDto.setStatus("SUCCESS");
		responseDto.setCode("00");
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return responseDto;
	}

	public int deleteAdhocOrders(String adhocOrderId, String userId, String partNum) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		String queryStr = "DELETE FROM AdhocOrders ad WHERE ad.fwoNum=:fwoNum and ad.userId=:userId and ad.partNum=:partNum";
		Query query = session.createQuery(queryStr);
		query.setParameter("fwoNum", adhocOrderId);
		query.setParameter("userId", userId);
		query.setParameter("partNum", partNum);

		int result = query.executeUpdate();
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return result;

	}

	public List<AdhocOrderDto> getAdhocOrders(AdhocRequestDto adhocRequestDto) {
		StringBuilder queryString = new StringBuilder();
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		queryString.append("SELECT ao FROM AdhocOrders ao WHERE ao.fwoNum = ao.fwoNum");

		if (adhocRequestDto.getAdhocOrderId() != null && !(adhocRequestDto.getAdhocOrderId().equals(""))) {
			queryString.append(" AND ao.fwoNum=:fwoNum");
		}
		if ((adhocRequestDto.getFromDate() != null && !(adhocRequestDto.getFromDate().equals("")))
				&& (adhocRequestDto.getToDate() != null) && !(adhocRequestDto.getToDate().equals(""))) {
			queryString.append(" AND ao.createdDate BETWEEN :fromDate AND :toDate");
		}
		if (adhocRequestDto.getCreatedBy() != null && !(adhocRequestDto.getCreatedBy().equals(""))) {
			queryString.append(" AND ao.userId=:userId");
		}
		if (adhocRequestDto.getPartNo() != null && !(adhocRequestDto.getPartNo().equals(""))) {
			queryString.append(" AND ao.partNum=:partNum");
		}

		queryString.append(" ORDER BY ao.createdDate DESC");
		Query query = session.createQuery(queryString.toString());

		if (adhocRequestDto.getAdhocOrderId() != null && !(adhocRequestDto.getAdhocOrderId().equals(""))) {
			query.setParameter("fwoNum", adhocRequestDto.getAdhocOrderId());
		}
		if ((adhocRequestDto.getFromDate() != null && !(adhocRequestDto.getFromDate().equals("")))
				&& (adhocRequestDto.getToDate() != null) && !(adhocRequestDto.getToDate().equals(""))) {
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
			try {
				Date d1 = (Date) sdf.parse(adhocRequestDto.getFromDate());
				Date d2 = (Date) sdf.parse(adhocRequestDto.getToDate());
				query.setParameter("fromDate", d1);
				query.setParameter("toDate", d2);
			} catch (ParseException e) {
				LOGGER.error("Exception On Date format:" + e.getMessage());
			}

		}
		if (adhocRequestDto.getCreatedBy() != null && !(adhocRequestDto.getCreatedBy().equals(""))) {
			query.setParameter("userId", adhocRequestDto.getCreatedBy());
		}
		if (adhocRequestDto.getPartNo() != null && !(adhocRequestDto.getPartNo().equals(""))) {
			query.setParameter("partNum", adhocRequestDto.getPartNo());
		}

		List<AdhocOrderDto> list = new ArrayList<>();
		@SuppressWarnings("unchecked")
		List<AdhocOrders> objectsList = (List<AdhocOrders>) query.list();
		for (AdhocOrders ao : objectsList) {
			list.add(exportAdhocOrdersDto(ao));
		}
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return list;
	}

	@SuppressWarnings("unchecked")
	@Override
	public Map<String, List<ReasonCodeDto>> getReasonCode() {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		Map<String, List<ReasonCodeDto>> result = new HashMap<>();
		List<ReasonCodeDto> reasonCodesList = new ArrayList<>();
		List<ReasonCode> reasonCodes = new ArrayList<>();

		try {
			String queryStr = "select rc from ReasonCode rc";
			Query query = session.createQuery(queryStr);
			reasonCodes = query.list();
			for (ReasonCode reasonCode : reasonCodes) {
				reasonCodesList.add(exportReasonCode(reasonCode));
			}
			result.put("aReasonCodes", reasonCodesList);
		} catch (Exception e) {
			LOGGER.error("Exception in getReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}
		return result;

	}

	@SuppressWarnings("unchecked")
	@Override
	public List<LkDivisionsDto> getAllDivisions() {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<LkDivisionsDto> divDtoList = new ArrayList<>();
		List<LkDivisions> divList = new ArrayList<>();

		try {
			String queryStr = "select div from LkDivisions div";
			Query query = session.createQuery(queryStr);
			divList = query.list();
			for (LkDivisions lkDiv : divList) {
				divDtoList.add(lkDivDao.exportDivisions(lkDiv));
			}
		} catch (Exception e) {
			LOGGER.error("Exception in getReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}
		return divDtoList;

	}

	@SuppressWarnings("unchecked")
	@Override
	public List<LkCountriesDto> getAllCountries() {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<LkCountriesDto> couDtoList = new ArrayList<>();
		List<LkCountries> couList = new ArrayList<>();

		try {
			String queryStr = "select cou from LkCountries cou";
			Query query = session.createQuery(queryStr);
			couList = query.list();
			for (LkCountries lkcou : couList) {
				couDtoList.add(lkCouDao.exportCountries(lkcou));
			}
		} catch (Exception e) {
			LOGGER.error("Exception in getReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}
		return couDtoList;

	}

	@SuppressWarnings("unchecked")
	@Override
	public List<LkShipperDetailsDto> getAllShipperDetails() {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<LkShipperDetailsDto> shipDtoList = new ArrayList<>();
		List<LkShipperDetails> shipList = new ArrayList<>();

		try {
			String queryStr = "select ship from LkShipperDetails ship";
			Query query = session.createQuery(queryStr);
			shipList = query.list();
			for (LkShipperDetails lkShipper : shipList) {
				shipDtoList.add(lkShipperDao.exportShipperDetails(lkShipper));
			}
		} catch (Exception e) {
			LOGGER.error("Exception in getReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}
		return shipDtoList;

	}

	@Override
	public ResponseDto addReasonCode(ReasonCodeDto reasonCodeDto) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		ResponseDto responseDto = new ResponseDto();
		try {
			session.saveOrUpdate(importReasonCode(reasonCodeDto));
			responseDto.setCode("00");
			responseDto.setMessage("Save Success");
			responseDto.setStatus("SUCCESS");
			return responseDto;

		} catch (Exception e) {
			LOGGER.error("Exception in addReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}
		return responseDto;

	}

	public String getReasonCodeDescById(String id) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		String desc = "";
		String queryStr = "select rc from ReasonCode rc where rc.reasonCodeKey=:reasonCodeKey";
		Query query = session.createQuery(queryStr);
		query.setParameter("reasonCodeKey", id);
		@SuppressWarnings("unchecked")
		List<ReasonCode> reasonCodes = query.list();
		for (ReasonCode reasonCode : reasonCodes) {
			desc = reasonCode.getReasonCodeValue();
		}
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return desc;
	}

	@SuppressWarnings("unchecked")
	public List<LkShipperDetailsDto> getShipperDetails(String shipperName) {
		// String queryStr = "select sh from LkShipperDetails sh where
		// sh.shipperName=:shipperName";
		@SuppressWarnings("deprecation")
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		Criteria crit = session.createCriteria(LkShipperDetails.class);
		crit.add(Restrictions.like("shipperName", "'" + shipperName + "'%", MatchMode.ANYWHERE));
		List<LkShipperDetailsDto> listOfShipper = crit.list();
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return listOfShipper;

	}

}
