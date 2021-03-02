package com.incture.lch.adhoc.dao;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.incture.lch.adhoc.dto.PreferenceDto;
import com.incture.lch.adhoc.entity.Preference;


@Repository
public class PreferenceDao
{
	
	@Autowired
	private SessionFactory sessionFactory;
	private Session session;
	private Transaction transaction;
	
	//getPreferencece
	public List<PreferenceDto> getPreference(String userId) throws IllegalArgumentException, IllegalAccessException{
		
		List<PreferenceDto> preferenceDto=new ArrayList<PreferenceDto>();
		
		/*String userId= userInfoDto;*/
		try{
			session=sessionFactory.openSession();
			transaction = session.beginTransaction();
			
			
			preferenceDto=exportDto(session.get(Preference.class, userId));
			
			transaction.commit();
		}
		catch(Exception e){
			transaction.rollback();
		}
		finally{
			session.close();
		}
		
		return preferenceDto;
	}
	
	public String setPreference(List<PreferenceDto> preferenceDto,String userId)
	{
		
		try{
			session=sessionFactory.openSession();
			transaction = session.beginTransaction();
			
			Preference preferences=importDto(preferenceDto,userId);
			System.out.println("inside DAO");

			session.saveOrUpdate(preferences);
			//session.save(preferences);
			transaction.commit();
			System.out.println("After DAO");
		}
		catch(Exception e){
			transaction.rollback();
		}
		finally{
			session.close();
		}
		
		return "success";
	}
	
	
	
	public List<PreferenceDto> exportDto(Preference preference) throws IllegalArgumentException, IllegalAccessException {
	
		List<PreferenceDto> preferencedto=new ArrayList<PreferenceDto>();
		
		if(preference==null){
			return null;
		}
		
		for(Field field:preference.getClass().getDeclaredFields()){
			
			field.setAccessible(true);
			//System.out.println(field.getName());
			
			
			if(field.getName()!="PreferenceId" ||!( field.getName().equalsIgnoreCase("PreferenceId"))){
				
				PreferenceDto dto=new PreferenceDto();
				
				dto.setColumnName(field.getName());
				
				String value=(String)field.get(preference);
				
				if(value.charAt(0)=='T')
					dto.setIsVisible(true);
				else
					dto.setIsVisible(false);
				
				if(value.charAt(1)=='T')
					dto.setIsMandatory(true);
				else
					dto.setIsMandatory(false);
				if(value.charAt(2)=='T')
					dto.setIsEditable(true);
				else
					dto.setIsEditable(false);
				int i= value.indexOf(".");
				int len=value.length();
				dto.setSequence(Integer.parseInt(value.substring(3,i)));
				dto.setSequenceHistory(Integer.parseInt(value.substring(i+1,len)));
				
				preferencedto.add(dto);
				
			}
		}
			
		return preferencedto;
	}
	
	public Preference importDto(List<PreferenceDto> preferencedto,String userid){
		
		Preference preference = new Preference();
		
		preference.setPreferenceId(userid);
System.out.println("inside import");
		for(PreferenceDto dto:preferencedto){
			if(dto.getColumnName().equals("businessDivision"))
				preference.setBusinessDivision(generateValue(dto));
			else if(dto.getColumnName().equals("adhocOrderId"))
				preference.setAdhocOrderId(generateValue(dto));
			else if(dto.getColumnName().equals("countryOrigin"))
				preference.setCountryOrigin(generateValue(dto));
			else if(dto.getColumnName().equals("createdBy"))
				preference.setCreatedBy(generateValue(dto));
			else if(dto.getColumnName().equals("createdDate"))
				preference.setCreatedDate(generateValue(dto));
			else if(dto.getColumnName().equals("currency"))
				preference.setCurrency(generateValue(dto));
			else if(dto.getColumnName().equals("destinationAddress"))
				preference.setDestinationAddress(generateValue(dto));
			
			else if(dto.getColumnName().equals("destinationCity"))
				preference.setDestinationCity(generateValue(dto));
			else if(dto.getColumnName().equals("destinationName"))
				preference.setDestinationName(generateValue(dto));
			
			else if(dto.getColumnName().equals("destinationState"))
				preference.setDestinationState(generateValue(dto));
			
			else if(dto.getColumnName().equals("destinationZip"))
				preference.setDestinationZip(generateValue(dto));
			
			else if(dto.getColumnName().equals("expectedDeliveryDate"))
				preference.setExpectedDeliveryDate(generateValue(dto));
			
			else if(dto.getColumnName().equals("originAddress"))
				preference.setOriginAddress(generateValue(dto));
			else if(dto.getColumnName().equals("originCity"))
				preference.setOriginCity(generateValue(dto));
			
			else if(dto.getColumnName().equals("originState"))
				preference.setOriginState(generateValue(dto));
			
			else if(dto.getColumnName().equals("originZip"))
				preference.setOriginZip(generateValue(dto));
			
			else if(dto.getColumnName().equals("packageType"))
				preference.setPackageType(generateValue(dto));
			
			else if(dto.getColumnName().equals("partNum"))
				preference.setPartNum(generateValue(dto));
			else if(dto.getColumnName().equals("partDescription"))
				preference.setPartDescription(generateValue(dto));
			else if(dto.getColumnName().equals("quantity"))
				preference.setQuantity(generateValue(dto));
			
			else if(dto.getColumnName().equals("shipDate"))
				preference.setShipDate(generateValue(dto));
			
			else if(dto.getColumnName().equals("weight"))
				preference.setWeight(generateValue(dto));
				
		}
		
		return preference;
	}
	
	public String generateValue(PreferenceDto dto){
		
		String value="";
		
		if(dto.getIsVisible())
			value=value+"T";
		else
			value=value+"F";
		
		if(dto.getIsMandatory())
			value=value+"T";
		else
			value=value+"F";
		
		if(dto.getIsEditable())
			value=value+"T";
		else
			value=value+"F";
		
		value=value+String.valueOf(dto.getSequence());
		value= value+String.valueOf(".");
		value=value+String.valueOf(dto.getSequenceHistory());

		return value;
	}

}
