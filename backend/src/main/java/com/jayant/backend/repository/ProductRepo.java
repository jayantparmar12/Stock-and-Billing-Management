package com.jayant.backend.repository;

import com.jayant.backend.Entity.Payment;
import com.jayant.backend.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepo extends JpaRepository<Product, Integer> {
    long countByQuantityLessThan(Integer quantity);
    List<Product> findByQuantityLessThan(Integer quantity);
}
