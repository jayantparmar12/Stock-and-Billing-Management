package com.jayant.backend.repository;

import com.jayant.backend.Entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepo extends JpaRepository<Payment, Integer> {
    List<Payment> findByBillId(Integer id);
}
