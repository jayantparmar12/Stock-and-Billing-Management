package com.jayant.backend.repository;

import com.jayant.backend.Entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockMovementRepo extends JpaRepository<StockMovement, Integer> {
    List<StockMovement> findByProductIdOrderByMovementDateDesc(Integer productId);
}
