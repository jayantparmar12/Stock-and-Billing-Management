package com.jayant.backend.DTO;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductResponse {
    private Integer id;

    private String name;
    private String category;
    private Integer quantity;
    private Double price;
}
