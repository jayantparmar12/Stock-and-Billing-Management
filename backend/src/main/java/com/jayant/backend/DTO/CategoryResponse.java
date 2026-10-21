package com.jayant.backend.DTO;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Integer id;
    private String name;
    private String description;
    private Long productsVariety;
}
