package com.jayant.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @ManyToOne
    @JoinColumn(name = "shop_id", nullable = false)
    @JsonIgnore
    private Shop shop;

    @Column(nullable = false)
    private String unit = "pcs";
}
