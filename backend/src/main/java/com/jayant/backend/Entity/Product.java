package com.jayant.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Entity
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true)
    @NotBlank(message = "product name is required")
    private String product;

    @PositiveOrZero(message = "product quantity must be greater than zero")
    private Integer quantity;

    @Positive(message = "product price must be greater than zero")
    private Double price;
    @ManyToOne
    @JoinColumn(name="category_id")
    @NotNull(message = "Category is Required")
    private Category category;
}
