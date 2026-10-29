package com.jayant.backend.DTO;

import com.jayant.backend.Entity.Category;
import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class ProductRequest {
    private Integer id;

    @Column(unique = true)
    @NotBlank(message = "product name is required")
    private String name;

    @PositiveOrZero(message = "product quantity must be greater than zero")
    private Integer quantity;

    @Positive(message = "product price must be greater than zero")
    private Double price;
    @NotNull(message = "Category is Required")
    private Integer  category;

    private String unit;
}
