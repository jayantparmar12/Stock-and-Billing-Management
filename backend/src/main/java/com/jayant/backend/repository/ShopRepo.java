package com.jayant.backend.repository;

import com.jayant.backend.Entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShopRepo extends JpaRepository<Shop, Integer> {
    Optional<Shop> findByShopCodeIgnoreCase(String shopCode);
    boolean existsByShopCodeIgnoreCase(String shopCode);
}