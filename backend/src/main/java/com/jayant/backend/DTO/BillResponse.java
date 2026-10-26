package com.jayant.backend.DTO;

import com.jayant.backend.Entity.BillStatus;
import com.jayant.backend.Entity.Customer;
import com.jayant.backend.Entity.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BillResponse {
    private Integer id;
    private Customer customer;
    private LocalDateTime billDate;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BillStatus status;
    private PaymentStatus paymentStatus;
    private List<BillItemResponse> items;
}