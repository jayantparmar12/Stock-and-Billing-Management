package com.jayant.backend.repository;

import com.jayant.backend.Entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepo extends JpaRepository<Customer, Integer> {
    List<Customer> findByShopId(Integer shopId);
    Optional<Customer> findByIdAndShopId(Integer id, Integer shopId);
    boolean existsByIdAndShopId(Integer id, Integer shopId);
    long countByShopId(Integer shopId);
}
