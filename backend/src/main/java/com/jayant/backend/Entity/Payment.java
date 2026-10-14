package com.jayant.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull(message = "Enter an amount")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    @ManyToOne
    @JoinColumn(name = "bill_id")
    private Bill bill;

    private LocalDateTime paymentDate;
}
