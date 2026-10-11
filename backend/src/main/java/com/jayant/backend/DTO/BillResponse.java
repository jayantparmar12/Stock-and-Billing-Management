package com.jayant.backend.DTO;

import com.jayant.backend.Entity.Customer;
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
    private List<BillItemResponse> items;
}
