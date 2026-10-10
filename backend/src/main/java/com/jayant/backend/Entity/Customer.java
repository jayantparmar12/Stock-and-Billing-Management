package com.jayant.backend.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data

public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String phone;
    private String email;
    private String address;
}
