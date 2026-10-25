package com.jayant.backend.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String shopName;

    @Column(unique = true, nullable = false)
    private String shopCode;
}