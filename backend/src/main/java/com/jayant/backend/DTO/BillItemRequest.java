package com.jayant.backend.DTO;

import lombok.Data;

@Data
public class BillItemRequest {
    private Integer product_id;
    private Integer quantity;
}
