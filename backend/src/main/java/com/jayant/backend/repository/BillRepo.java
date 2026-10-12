package com.jayant.backend.repository;

import com.jayant.backend.Entity.Bill;
import com.jayant.backend.Entity.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface BillRepo extends JpaRepository<Bill, Integer> {
    List<Bill> findByCustomerId(Integer id);
    List<Bill> findByBillDateBetween(LocalDateTime start, LocalDateTime end);
    List<Bill> findByCustomer_NameContainingIgnoreCase(String name);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.status IS NULL OR b.status <> :status")
    BigDecimal sumOfTotalAmount(@Param("status") BillStatus status);

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Bill b WHERE b.status <> :status")
    BigDecimal sumOfPaidAmount(@Param("status") BillStatus status);
}
