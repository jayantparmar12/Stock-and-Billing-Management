package com.jayant.backend.DTO;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BillItemResponse {
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal itemTotal;
}
