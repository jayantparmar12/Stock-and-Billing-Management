package com.jayant.backend.DTO;

import lombok.Data;

import java.util.List;

@Data
public class BillRequest {
    private Integer customer_id;
    private List<BillItemRequest> items;
}

//public class BillItemRequest {
//    private Integer product_id;
//    private Integer quantity;
//}