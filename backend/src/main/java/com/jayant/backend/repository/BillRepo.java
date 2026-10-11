package com.jayant.backend.repository;

import com.jayant.backend.Entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BillRepo extends JpaRepository<Bill, Integer> {
    List<Bill> findByCustomerId(Integer id);
    List<Bill> findByBillDateBetween(LocalDateTime start, LocalDateTime end);
    List<Bill> findByCustomer_NameContainingIgnoreCase(String name);
}
