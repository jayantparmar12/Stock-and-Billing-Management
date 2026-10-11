package com.jayant.backend.repository;

import com.jayant.backend.Entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillItemRepo extends JpaRepository<BillItem, Integer> {
    List<BillItem> findByBillId(Integer id);
}
