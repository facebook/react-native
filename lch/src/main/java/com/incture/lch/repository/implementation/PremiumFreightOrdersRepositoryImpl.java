package com.incture.lch.repository.implementation;

import java.nio.charset.Charset;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;

import org.apache.xmlbeans.impl.xb.xsdschema.RestrictionDocument.Restriction;
import org.hibernate.Criteria;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.criterion.Restrictions;
import org.hibernate.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.incture.lch.dao.CarrierDetailsDao;
import com.incture.lch.dto.CarrierDetailsDto;
import com.incture.lch.dto.ChargeRequestDto;
import com.incture.lch.dto.PremiumFreightOrderDto;
import com.incture.lch.dto.PremiumRequestDto;
import com.incture.lch.entity.AdhocOrders;
import com.incture.lch.entity.CarrierDetails;
import com.incture.lch.entity.PremiumFreightChargeDetails;
import com.incture.lch.repository.PremiumFreightOrdersRepository;
import com.incture.lch.util.GetReferenceData;
import com.incture.lch.util.ServiceUtil;

@Repository
public class PremiumFreightOrdersRepositoryImpl implements PremiumFreightOrdersRepository {

	@Autowired
	// @Qualifier("sessionDb")
	private SessionFactory sessionFactory;
	
	@Autowired
	GetReferenceData getReferenceData;

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
		//premiumFreightOrderDto.setStatus(status);

		return premiumFreightOrderDto;
	}

	 

	// List of all the Premium Freight Orders based on the PlannerEmail plus date filters
	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Override
	public List<PremiumFreightOrderDto> getAllPremiumFreightOrders(PremiumRequestDto premiumRequestDto) {
		StringBuilder queryString = new StringBuilder();
		List<PremiumFreightOrderDto> premiumFreightOrderDtos = new ArrayList<>();
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();

		// Querying A/T the details
		//queryString.append("SELECT ao from AdhocOrders ao WHERE ao.premiumFreight=true");
		
		Criteria criteria = session.createCriteria(AdhocOrders.class);
		System.out.println(criteria.list().size());

		criteria.add(Restrictions.eq("premiumFreight", "true"));

		System.out.println(criteria.list().size());
		if (premiumRequestDto.getAdhocOrderId() != null && !(premiumRequestDto.getAdhocOrderId().equals(""))) {
			//queryString.append(" AND ao.fwoNum=:fwoNum");
			criteria.add(Restrictions.eq("adhocOrderId", premiumRequestDto.getAdhocOrderId()));

		}
		if ((premiumRequestDto.getFromDate() != null && !(premiumRequestDto.getFromDate().equals("")))
				&& (premiumRequestDto.getToDate() != null) && !(premiumRequestDto.getToDate().equals(""))) {
			//queryString.append(" AND ao.createdDate BETWEEN :fromDate AND :toDate");
			criteria.add(Restrictions.between("createdDate", premiumRequestDto.getFromDate(), premiumRequestDto.getToDate()));

		}
		if (premiumRequestDto.getPlannerEmail() != null && !(premiumRequestDto.getPlannerEmail().equals(""))) {
			//queryString.append(" AND ao.plannerEmail=:plannerEmail");
			criteria.add(Restrictions.eq("plannerEmail", premiumRequestDto.getPlannerEmail()));

		}
		if (premiumRequestDto.getPartNo() != null && !(premiumRequestDto.getPartNo().equals(""))) {
			//queryString.append(" AND ao.partNum=:partNum");
			criteria.add(Restrictions.eq("partNo", premiumRequestDto.getPartNo()));

		}
		if(premiumRequestDto.getStatus()!=null && !(premiumRequestDto.getStatus().equals("")))
		{
			//queryString.append("AND ao.status=:status");
			criteria.add(Restrictions.eq("status", premiumRequestDto.getStatus()));
		}

		/*queryString.append(" ORDER BY ao.createdDate DESC");
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

		//List<AdhocOrders> adhocOrders = query.list();
*/
		List<AdhocOrders> adhocOrders = criteria.list();
		System.out.println(adhocOrders.size());
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

	@Override
	@SuppressWarnings("unchecked")
	public List<CarrierDetailsDto> getAllCarrierDetails() 
	{
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<CarrierDetailsDto> carrierDetailsDtos = new ArrayList<>();
		List<CarrierDetails> carrierDetails = new ArrayList<>();
		
		
		try {
			Criteria criteria = session.createCriteria(CarrierDetails.class);
			carrierDetails= criteria.list();
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

	@Override
	public List<String> getMode(String bpNumber) {
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<String> modeList = new ArrayList<>();
		// List<CarrierDetailsDto> carrierDetailsDtos=new ArrayList<>();
		List<CarrierDetails> carrierDetails = new ArrayList<>();
		try {
			Criteria criteria = session.createCriteria(CarrierDetails.class);
			criteria.add(Restrictions.eq("bpNumber", bpNumber));
			/*String queryStr = "select carrier from CarrierDetails carrier WHERE carrier.bpNumber=: bpnumber";
			Query query = session.createQuery(queryStr);
			query.setParameter("bpNumber", bpNumber);
			carrierDetails = query.list();*/
			carrierDetails = criteria.list();
			
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
	
	
	//This Function will receive the list of AdhocOrders whose charge we want the CA to calculate
	//On getting the Charge respond the Same DTO Premium one for the CA 
	//The status changes to Pending with Carrier admin
	@Override
	public List<PremiumFreightOrderDto> setCarrierDetails(List<ChargeRequestDto> chargeRequestDto)
	{
		
		Session session= sessionFactory.openSession();
		Transaction tx= session.beginTransaction();
		List<PremiumFreightOrderDto> premiumFreightOrderDtos=new ArrayList<PremiumFreightOrderDto>();
		List<AdhocOrders> adhocOrders = new ArrayList<AdhocOrders>();
		PremiumFreightOrderDto premiumdto =new PremiumFreightOrderDto();
		List<String> adhocOrderIds = new ArrayList<String>();
		for(ChargeRequestDto c: chargeRequestDto)
		{
			/*adhocOrderIds.add(c.getAdhocOrderId());
		}
		for(String adid:adhocOrderIds)
		{*/
			String adid=c.getAdhocOrderId();
		try {
			String queryStr = "SELECT ao FROM AdhocOrders ao WHERE ao.fwoNum = ao.fwoNum AND ao.fwoNum=:fwoNum";
			Query query = session.createQuery(queryStr);
			query.setParameter("fwoNum", adid);
			adhocOrders = query.list();
			 
			
			for (AdhocOrders aorders : adhocOrders)
			{
				PremiumFreightChargeDetails premiumFreightChargeDetails=new PremiumFreightChargeDetails();

				aorders.setStatus("Pending with Carrier Admin");
				session.saveOrUpdate(aorders);
				premiumdto= exportPremiumFreightOrders(aorders);
				premiumdto.setStatus("Pending with Carrier Admin");
				premiumFreightOrderDtos.add(premiumdto);
				Criteria criteria= session.createCriteria(PremiumFreightChargeDetails.class);
				criteria.add(Restrictions.eq("adhocOrderId", adid));
				 
					premiumFreightChargeDetails.setAdhocOrderId(adid);
					
					premiumFreightChargeDetails.setBpNumber(c.getBpNumber());
					premiumFreightChargeDetails.setCarrierDetails(c.getCarrierDetails());
					premiumFreightChargeDetails.setCarrierMode(c.getCarrierMode());
					premiumFreightChargeDetails.setCarrierScac(c.getCarrierScac());
					
					premiumFreightChargeDetails.setOriginName(aorders.getShipperName());
					premiumFreightChargeDetails.setOriginAddress(aorders.getOriginAddress());
					premiumFreightChargeDetails.setOriginCity(aorders.getOriginCity());
					premiumFreightChargeDetails.setOriginState(aorders.getOriginState());
					premiumFreightChargeDetails.setOriginCountry(aorders.getCountryOrigin());
					premiumFreightChargeDetails.setOriginZip(aorders.getOriginZip());
					
					premiumFreightChargeDetails.setDestinationName(aorders.getDestinationName());
					premiumFreightChargeDetails.setDestinationAdress(aorders.getDestinationAddress());
					premiumFreightChargeDetails.setDestinationCity(aorders.getDestinationCity());
					premiumFreightChargeDetails.setDestinationState(aorders.getDestinationState());
					premiumFreightChargeDetails.setDestinationCountry(aorders.getDestinationCountry());
					premiumFreightChargeDetails.setDestinationZip(aorders.getDestinationZip());
					
					premiumFreightChargeDetails.setCharge(0);
					
					premiumFreightChargeDetails.setReasonCode(aorders.getPremiumReasonCode());
					premiumFreightChargeDetails.setStatus("Pending with Carrier Admin");
					premiumFreightChargeDetails.setPlannerEmail(aorders.getPlannerEmail());
					

					

					session.saveOrUpdate(premiumFreightChargeDetails);;
				
				
			}
		} catch (Exception e) {
			// LOGGER.error("Exception in getReasonCode api" + e);
		} finally {
			session.flush();
			session.clear();
			tx.commit();
			session.close();
		}
		}
		return premiumFreightOrderDtos;
	}
	
	//Charge is set by the carrier admin here. Once the Charge is set it updates the charge table 
	//and update the Status as in progress

	@SuppressWarnings("unchecked")
	@Override
	public String setCharge(ChargeRequestDto dto)
	{
		Session session = sessionFactory.openSession();
		Transaction tx = session.beginTransaction();
		List<AdhocOrders> adhocOrders = new ArrayList<AdhocOrders>();
		PremiumFreightChargeDetails premiumFreightChargeDetail = new PremiumFreightChargeDetails();
		List<PremiumFreightChargeDetails> premiumFreightChargeDetails= new ArrayList<PremiumFreightChargeDetails>();
		@SuppressWarnings("deprecation")
		Criteria criteria = session.createCriteria(AdhocOrders.class);
		criteria.add(Restrictions.eq("fwoNum", dto.getAdhocOrderId()));
		adhocOrders = criteria.list();
		
		Criteria criteria2 = session.createCriteria(PremiumFreightChargeDetails.class);
		criteria2.add(Restrictions.eq("adhocOrderId", dto.getAdhocOrderId()));
		premiumFreightChargeDetails=criteria2.list();
		if(premiumFreightChargeDetails==null)
		{
		for (AdhocOrders a : adhocOrders) 
		{
			premiumFreightChargeDetail.setAdhocOrderId(a.getFwoNum());

			System.out.println(premiumFreightChargeDetail.getAdhocOrderId());
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
			//premiumFreightChargeDetail.setStatus(a.getStatus());
			premiumFreightChargeDetail.setStatus("In Progress");

		}
		
		premiumFreightChargeDetail.setBpNumber(dto.getBpNumber());
		premiumFreightChargeDetail.setCarrierScac(dto.getCarrierScac());
		premiumFreightChargeDetail.setCarrierDetails(dto.getCarrierDetails());
		premiumFreightChargeDetail.setCarrierMode(dto.getCarrierMode());
		premiumFreightChargeDetail.setCharge(dto.getCharge());
		session.saveOrUpdate(premiumFreightChargeDetail);
		}
		else
		{
			for(PremiumFreightChargeDetails p:premiumFreightChargeDetails)
			{
				p.setCharge(dto.getCharge());
				p.setStatus("In Progress");
				session.saveOrUpdate(p);
			}
		}
		session.flush();
		session.clear();
		tx.commit();
		session.close();
        return "Charge Set";
	}
	
	

	@Override
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
					a.setStatus("Pending With Approver");
				}
			}
			
			for(PremiumFreightChargeDetails a:premiumChargeDetails)
			{
				if(a.getStatus()==null && !a.getStatus().equals("") || !a.getStatus().equals("Approved"))
				{
					a.setStatus("Pending with Approver");
				}
			}
			
		}
		
	return "Pending with Approver";
    }
	
	
	@Override	
	public String RejectPremiumOrder (String adhocOrderId) {
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
