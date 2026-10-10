package com.jayant.backend.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(unique = true)
    private String product;
    private Integer quantity;
    private Double price;
    @ManyToOne
    @JoinColumn(name="category_id")
    private Category category;
}
