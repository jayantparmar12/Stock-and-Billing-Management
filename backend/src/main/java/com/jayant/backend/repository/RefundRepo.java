package com.jayant.backend.repository;

import com.jayant.backend.Entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefundRepo extends JpaRepository<Refund, Integer> {
    List<Refund> findByBillId(Integer id);
}
