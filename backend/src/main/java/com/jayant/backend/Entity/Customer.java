package com.jayant.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Data

public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    @NotBlank(message = "Customer name is required")
    private String name;

    @Column(nullable = false)
    @NotBlank(message = "Customer phone is required")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;
    private String address;
}
