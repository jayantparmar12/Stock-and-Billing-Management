package com.jayant.backend.DTO;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DashboardResponse {
    private long totalProducts;
    private long totalCustomers;
    private BigDecimal totalSales;
    private BigDecimal pendingPayments;
    private long lowStockProducts;
}
