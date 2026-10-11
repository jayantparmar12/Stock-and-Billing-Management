package com.jayant.backend.DTO;

import com.jayant.backend.Entity.Customer;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class BillResponse {
    private Integer id;
    private Customer customer;
    private LocalDateTime billDate;
    private Double totalAmount;
    private List<BillItemResponse> items;
}
