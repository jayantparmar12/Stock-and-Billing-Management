package com.jayant.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Data
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(unique = true)
    @NotBlank(message = "Category name is required")
    private String name;
    @NotBlank(message = "Category description is required")
    private String description;
}
