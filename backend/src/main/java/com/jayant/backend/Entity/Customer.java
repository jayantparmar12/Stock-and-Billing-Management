package com.jayant.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    @NotBlank(message = "Customer phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Please enter exactly 10 digits phone number")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;
    private String address;

    @ManyToOne
    @JoinColumn(name = "shop_id", nullable = false)
    @JsonIgnore
    private Shop shop;
}
