package com.jayant.backend.DTO;

import lombok.Data;

@Data
public class BillItemResponse {
    private String productName;
    private Integer quantity;
    private Double unitPrice;
    private Double itemTotal;
}
