package com.jayant.backend.repository;

import com.jayant.backend.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepo extends JpaRepository<Product, Integer> {
    List<Product> findByShopId(Integer shopId);
    Optional<Product> findByIdAndShopId(Integer id, Integer shopId);
    boolean existsByIdAndShopId(Integer id, Integer shopId);
    List<Product> findByShopIdAndQuantityLessThan(Integer shopId, Integer threshold);
    long countByShopId(Integer shopId);
    long countByShopIdAndQuantityLessThan(Integer shopId, Integer threshold);
}
