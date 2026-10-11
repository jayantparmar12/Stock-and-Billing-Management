package com.jayant.backend.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private BigDecimal amount;
    @ManyToOne
    @JoinColumn(name = "bill_id")
    private Bill bill;
    private LocalDateTime paymentDate;
}
