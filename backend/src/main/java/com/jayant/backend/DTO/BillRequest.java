package com.jayant.backend.DTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class BillRequest {
    @NotNull(message = "Customer ID is required")
    @Positive(message = "Customer ID must be greater than zero")
    private Integer customer_id;

    @NotEmpty(message = "Bill must contain at least one item")
    @Valid
    private List<BillItemRequest> items;
}