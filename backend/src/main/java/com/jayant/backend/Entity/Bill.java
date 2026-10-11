package com.jayant.backend.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;
    private LocalDateTime billDate;
    private Double totalAmount;
    @Enumerated(EnumType.STRING)
    private BillStatus status = BillStatus.ACTIVE;
}
