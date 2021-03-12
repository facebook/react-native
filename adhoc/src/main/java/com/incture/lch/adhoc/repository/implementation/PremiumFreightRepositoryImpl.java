package com.incture.lch.adhoc.repository.implementation;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.logging.Logger;

import org.apache.xmlbeans.impl.xb.xsdschema.RestrictionDocument.Restriction;
import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.criterion.Restrictions;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.ResponseBody;

import com.incture.lch.adhoc.dao.CarrierDetailsDao;
import com.incture.lch.adhoc.dto.AdhocOrderDto;
import com.incture.lch.adhoc.dto.CarrierAdminChargeRequestDto;
import com.incture.lch.adhoc.dto.GetCostRequestDto;
import com.incture.lch.adhoc.dto.CarrierDetailsDto;
import com.incture.lch.adhoc.dto.LkShipperDetailsDto;
import com.incture.lch.adhoc.dto.PremiumFreightOrderDto;
import com.incture.lch.adhoc.dto.PremiumRequestDto;
import com.incture.lch.adhoc.entity.AdhocOrders;
import com.incture.lch.adhoc.entity.CarrierDetails;
import com.incture.lch.adhoc.entity.LkShipperDetails;
import com.incture.lch.adhoc.entity.PremiumFreightChargeDetails;
import com.incture.lch.adhoc.repository.PremiumFreightOrdersRepository;
import com.incture.lch.adhoc.util.ServiceUtil;

public class PremiumFreightRepositoryImpl implements PremiumFreightOrdersRepository {

	@Autowired
	// @Qualifier("sessionDb")
	private SessionFactory sessionFactory;

	@Autowired
	private CarrierDetailsDao carrierDetailsDao;

	public void setSessionFactory(SessionFactory sf) {
		this.sessionFactory = sf;
	}

	@Override
	public PremiumFreightOrderDto exportPremiumFreightOrders(AdhocOrders adhocOrders) {

		PremiumFreightOrderDto premiumFreightOrderDto = new PremiumFreightOrderDto();

		premiumFreightOrderDto.setAdhocOrderId(adhocOrders.getFwoNum());
		premiumFreightOrderDto.setCreatedBy(adhocOrders.getCreatedBy());

		if (adhocOrders.getCreatedDate() != null && !(adhocOrders.getCreatedDate().equals(""))) {
			premiumFreightOrderDto.setCreatedDate(ServiceUtil.convertDateToString(adhocOrders.getCreatedDate()));
		}

		premiumFreightOrderDto.setCountryOrigin(adhocOrders.getCountryOrigin());
		premiumFreightOrderDto.setCurrency(adhocOrders.getCurrency());

		premiumFreightOrderDto.setDestinationName(adhocOrders.getDestinationName());
		premiumFreightOrderDto.setDestinationAddress(adhocOrders.getDestinationAddress());
		premiumFreightOrderDto.setDestinationCity(adhocOrders.getDestinationCity());
		premiumFreightOrderDto.setDestinationState(adhocOrders.getDestinationState());
		premiumFreightOrderDto.setDestinationCountry(adhocOrders.getDestinationCountry());
		premiumFreightOrderDto.setDestinationZip(adhocOrders.getDestinationZip());

		premiumFreightOrderDto.setOriginName(adhocOrders.getShipperName());
		premiumFreightOrderDto.setOriginAddress(adhocOrders.getShippingContact());
		premiumFreightOrderDto.setOriginCity(adhocOrders.getOriginCity());
		premiumFreightOrderDto.setOriginState(adhocOrders.getOriginState());
		premiumFreightOrderDto.setOriginCountry(adhocOrders.getCountryOrigin());
		premiumFreightOrderDto.setOriginZip(adhocOrders.getOriginZip());

		premiumFreightOrderDto.setPremiumReasonCode(adhocOrders.getPremiumReasonCode());
		premiumFreightOrderDto.setPlannerEmail(adhocOrders.getPlannerEmail());
		premiumFreightOrderDto.setStatus(adhocOrders.getStatus());

		return premiumFreightOrderDto;
	}

	

	// List of all the Premium Freight Orders based on the PlannerEmail
	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Override
	public List<PremiumFreightOrderDto> getAllPremiumFreightOrders(PremiumRequestDto premiumRequestDto) {
		StringBuilder queryString = new StringBuilder();
		List<PremiumFreightOrderDto> premiumFreightOrderDtos = new ArrayList<>();
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();

		// Querying A/T the details
		queryString.append("SELECT ad from AdhocOrders ad WHERE ad.premiumFreight=true AND Order By fwoNum desc");

		if (premiumRequestDto.getAdhocOrderId() != null && !(premiumRequestDto.getAdhocOrderId().equals(""))) {
			queryString.append(" AND ao.fwoNum=:fwoNum");
		}
		if ((premiumRequestDto.getFromDate() != null && !(premiumRequestDto.getFromDate().equals("")))
				&& (premiumRequestDto.getToDate() != null) && !(premiumRequestDto.getToDate().equals(""))) {
			queryString.append(" AND ao.createdDate BETWEEN :fromDate AND :toDate");
		}
		if (premiumRequestDto.getPlannerEmail() != null && !(premiumRequestDto.getPlannerEmail().equals(""))) {
			queryString.append(" AND ao.plannerEmail=:plannerEmail");
		}
		if (premiumRequestDto.getPartNo() != null && !(premiumRequestDto.getPartNo().equals(""))) {
			queryString.append(" AND ao.partNum=:partNum");
		}
		if(premiumRequestDto.getStatus()!=null && !(premiumRequestDto.getStatus().equals("")))
		{
			queryString.append("AND ao.status=:status");
		}

		queryString.append(" ORDER BY ao.createdDate DESC");
		Query query = session.createQuery(queryString.toString());

		if (premiumRequestDto.getAdhocOrderId() != null && !(premiumRequestDto.getAdhocOrderId().equals(""))) {
			query.setParameter("fwoNum", premiumRequestDto.getAdhocOrderId());
		}
		if ((premiumRequestDto.getFromDate() != null && !(premiumRequestDto.getFromDate().equals("")))
				&& (premiumRequestDto.getToDate() != null) && !(premiumRequestDto.getToDate().equals(""))) {
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
			try {
				Date d1 = (Date) sdf.parse(premiumRequestDto.getFromDate());
				Date d2 = (Date) sdf.parse(premiumRequestDto.getToDate());
				query.setParameter("fromDate", d1);
				query.setParameter("toDate", d2);
			} catch (ParseException e) {
				// Logger.error("Exception On Date format:" + e.getMessage());
			}

		}
		if (premiumRequestDto.getPlannerEmail() != null && !(premiumRequestDto.getPlannerEmail().equals(""))) {
			query.setParameter("plannerEmail", premiumRequestDto.getPlannerEmail());
		}
		if (premiumRequestDto.getPartNo() != null && !(premiumRequestDto.getPartNo().equals(""))) {
			query.setParameter("partNum", premiumRequestDto.getPartNo());
		}
		if(premiumRequestDto.getStatus()!=null && !(premiumRequestDto.getStatus().equals("")))
		{
			query.setParameter("status", premiumRequestDto.getStatus());
		}

		List<AdhocOrders> adhocOrders = query.list();

		for (AdhocOrders adOrders : adhocOrders) {
			premiumFreightOrderDtos.add(exportPremiumFreightOrders(adOrders));
		}
		//
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return premiumFreightOrderDtos;
	}

	@SuppressWarnings("unchecked")
	public List<CarrierDetailsDto> getAllCarrierDetails() 
	{
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<CarrierDetailsDto> carrierDetailsDtos = new ArrayList<>();
		List<CarrierDetails> carrierDetails = new ArrayList<>();
		try {
			String queryStr = "select carrier from CarrierDetails carrier";
			Query query = session.createQuery(queryStr);
			carrierDetails = query.list();
			for (CarrierDetails cdetails : carrierDetails) {
				carrierDetailsDtos.add(carrierDetailsDao.exportCarrierDetails(cdetails));
			}
		} catch (Exception e) {
			// LOGGER.error("Exception in getReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}

		return carrierDetailsDtos;
	}

	public List<String> getMode(String bpNumber) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<String> modeList = new ArrayList<>();
		// List<CarrierDetailsDto> carrierDetailsDtos=new ArrayList<>();
		List<CarrierDetails> carrierDetails = new ArrayList<>();
		try {
			String queryStr = "select carrier from CarrierDetails carrier WHERE carrier.bpNumber=: bpnumber";
			Query query = session.createQuery(queryStr);
			query.setParameter("bpNumber", bpNumber);
			carrierDetails = query.list();
			for (CarrierDetails cdetails : carrierDetails) {
				modeList.add(cdetails.getCarrierMode());
			}
		} catch (Exception e) {
			// LOGGER.error("Exception in getReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}

		return modeList;
	}

	public int getCost(GetCostRequestDto dto)
	{
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<AdhocOrders> adhocOrders = new ArrayList<AdhocOrders>();
		List<PremiumFreightChargeDetails> premiumFreightChargeDetails = new ArrayList<PremiumFreightChargeDetails>();
		PremiumFreightChargeDetails premiumFreightChargeDetail = new PremiumFreightChargeDetails();
		PremiumFreightOrderDto premiumFreightOrderDto = new PremiumFreightOrderDto();
		Criteria criteria = session.createCriteria(AdhocOrders.class);
		criteria.add(Restrictions.eq("adhocOrderId", dto.getAdhocOrderId()));
		adhocOrders = criteria.list();

		for (AdhocOrders a : adhocOrders) 
		{
			premiumFreightChargeDetail.setAdhocOrderId(a.getFwoNum());

			premiumFreightChargeDetail.setOriginName(a.getShipperName());
			premiumFreightChargeDetail.setOriginAddress(a.getOriginAddress());
			premiumFreightChargeDetail.setOriginCity(a.getOriginCity());
			premiumFreightChargeDetail.setOriginState(a.getOriginState());
			premiumFreightChargeDetail.setOriginCountry(a.getOriginCountry());
			premiumFreightChargeDetail.setOriginZip(a.getOriginZip());

			premiumFreightChargeDetail.setDestinationAdress(a.getDestinationAddress());
			premiumFreightChargeDetail.setDestinationCity(a.getDestinationCity());
			premiumFreightChargeDetail.setDestinationState(a.getDestinationState());
			premiumFreightChargeDetail.setDestinationCountry(a.getDestinationCountry());
			premiumFreightChargeDetail.setDestinationZip(a.getDestinationZip());

			premiumFreightChargeDetail.setReasonCode(a.getPremiumReasonCode());
			premiumFreightChargeDetail.setPlannerEmail(a.getPlannerEmail());
			premiumFreightChargeDetail.setStatus(a.getStatus());

		}
		premiumFreightChargeDetail.setBpNumber(dto.getBpNumber());
		premiumFreightChargeDetail.setCarrierScac(dto.getCarrierScac());
		premiumFreightChargeDetail.setCarrierDetails(dto.getCarrierDetails());
		premiumFreightChargeDetail.setCarrierMode(dto.getCarrierMode());
		// premiumFreightChargeDetail.setCarrierRatePerKM(dto.get);

		Random rand = new Random();

		int random_cost = rand.nextInt(5000);
		

		if(premiumFreightChargeDetail.getCharge() == 0)
		{
		premiumFreightChargeDetail.setCharge(random_cost);
		}
		session.saveOrUpdate(premiumFreightChargeDetail);
		return premiumFreightChargeDetail.getCharge();
	}

	public String forwardToApprover(List<PremiumFreightChargeDetails> premiumFreightChargeDetail)
	{
		PremiumFreightChargeDetails chargeDetails= new PremiumFreightChargeDetails();
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		for(PremiumFreightChargeDetails p:premiumFreightChargeDetail)
		{
			String adhocOrderId= p.getAdhocOrderId();
			Criteria c1= session.createCriteria(AdhocOrders.class);
			Criteria c2=session.createCriteria(PremiumFreightChargeDetails.class);
			
			c1.add(Restrictions.eq("adhocOrderId", adhocOrderId));
			c2.add(Restrictions.eq("adhocOrderId", adhocOrderId));
			
			List<AdhocOrders> adhocOrders = new ArrayList<AdhocOrders>();
			List<PremiumFreightChargeDetails> premiumChargeDetails = new ArrayList<PremiumFreightChargeDetails>();
			
			adhocOrders=c1.list();
			premiumChargeDetails=c2.list();
			
			for(AdhocOrders a:adhocOrders)
			{
				if(a.getStatus()==null && !a.getStatus().equals("") || !a.getStatus().equals("Approved"))
				{
					a.setStatus("PLANNED");
				}
			}
			
			for(PremiumFreightChargeDetails a:premiumChargeDetails)
			{
				if(a.getStatus()==null && !a.getStatus().equals("") || !a.getStatus().equals("Approved"))
				{
					a.setStatus("PLANNED");
				}
			}
			
		}
		
	return "Order Planned";
    }
	
	public String RevertOrders (String adhocOrderId) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		String queryStr = "DELETE FROM AdhocOrders ad WHERE ad.fwoNum=:fwoNum";
		Query query = session.createQuery(queryStr);
		query.setParameter("fwoNum", adhocOrderId);
		int result = query.executeUpdate();
		
		
		String qstr= "DELETE FROM PremiumFreightChargeDetails p WHERE ad.adhocOrderId=:adhocOrderId" ;
		Query q2= session.createQuery(qstr);
		q2.setParameter("adhocOrderId", adhocOrderId);
		int result2=query.executeUpdate();
		
		session.flush();
		session.clear();
		tx.commit();
		session.close();
		return "deleted";

	}
	
}
