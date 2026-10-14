package com.jayant.backend.DTO;


import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class BillItemRequest {
    @NotNull(message = "Product ID is required")
    @Positive(message = "Product ID must be greater than zero")
    private Integer product_id;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    private Integer quantity;
}
