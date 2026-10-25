package com.jayant.backend.repository;

import com.jayant.backend.Entity.Payment;
import com.jayant.backend.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepo extends JpaRepository<Product, Integer> {
    long countByQuantityLessThan(Integer quantity);
    List<Product> findByQuantityLessThan(Integer quantity);
    long countByCategoryId(Integer id);
    List<Product> findByShopId(Integer shopId);
    Optional<Product> findByIdAndShopId(Integer id, Integer shopId);
    List<Product> findByShopIdAndQuantityLessThan(Integer shopId, Integer threshold);
    long countByShopId(Integer shopId);
    long countByShopIdAndQuantityLessThan(Integer shopId, Integer threshold);

}
