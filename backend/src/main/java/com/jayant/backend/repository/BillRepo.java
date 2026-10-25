package com.jayant.backend.repository;

import com.jayant.backend.Entity.Bill;
import com.jayant.backend.Entity.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BillRepo extends JpaRepository<Bill, Integer> {

    List<Bill> findByShopId(Integer shopId);

    Optional<Bill> findByIdAndShopId(Integer id, Integer shopId);

    boolean existsByIdAndShopId(Integer id, Integer shopId);

    List<Bill> findByShopIdAndCustomerId(Integer shopId, Integer customerId);

    List<Bill> findByShopIdAndBillDateBetween(Integer shopId, LocalDateTime start, LocalDateTime end);

    List<Bill> findByShopIdAndCustomer_NameContainingIgnoreCase(Integer shopId, String name);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.shop.id = :shopId AND b.status <> :excludedStatus")
    BigDecimal sumOfTotalAmountByShopId(@Param("shopId") Integer shopId, @Param("excludedStatus") BillStatus excludedStatus);

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Bill b WHERE b.shop.id = :shopId AND b.status <> :excludedStatus")
    BigDecimal sumOfPaidAmountByShopId(@Param("shopId") Integer shopId, @Param("excludedStatus") BillStatus excludedStatus);
}
