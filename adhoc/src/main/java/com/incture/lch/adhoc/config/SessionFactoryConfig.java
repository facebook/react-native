package com.incture.lch.adhoc.config;

import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;

import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.orm.jpa.JpaVendorAdapter;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;

//@Configuration
public class SessionFactoryConfig {/*

	@Autowired
	DataSource dataSource;

	@Autowired
	JpaVendorAdapter jpaVendorAdapter;

	@Bean
	@Primary
	public EntityManagerFactory entityManagerFactory() {
		LocalContainerEntityManagerFactoryBean emf = new LocalContainerEntityManagerFactoryBean();
		emf.setDataSource(dataSource);
		emf.setJpaVendorAdapter(jpaVendorAdapter);
		emf.setPackagesToScan("com.incture.lch");
		emf.setPersistenceUnitName("default");
		emf.afterPropertiesSet();
		return emf.getObject();
	}

	@Bean
	public SessionFactory setSessionFactory(EntityManagerFactory entityManagerFactory) {
		return entityManagerFactory.unwrap(SessionFactory.class);
	}
*/}
