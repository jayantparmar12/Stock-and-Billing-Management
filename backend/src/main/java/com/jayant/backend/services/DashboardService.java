package com.jayant.backend.services;

import com.jayant.backend.DTO.DashboardResponse;
import com.jayant.backend.Entity.BillStatus;
import com.jayant.backend.repository.BillRepo;
import com.jayant.backend.repository.CustomerRepo;
import com.jayant.backend.repository.ProductRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final ProductRepo productRepo;
    private final CustomerRepo customerRepo;
    private final BillRepo billRepo;

    public DashboardResponse getDashboard() {
        long totalProducts = productRepo.count();
        long totalCustomers = customerRepo.count();
        long lowStockProducts = productRepo.countByQuantityLessThan(11);
        BigDecimal totalSales = billRepo.sumOfTotalAmount(BillStatus.CANCELLED);
        BigDecimal pendingPayment = totalSales.subtract(billRepo.sumOfPaidAmount(BillStatus.CANCELLED));

        DashboardResponse dashboardResponse = new DashboardResponse();
        dashboardResponse.setTotalSales(totalSales);
        dashboardResponse.setLowStockProducts(lowStockProducts);
        dashboardResponse.setPendingPayments(pendingPayment);
        dashboardResponse.setTotalCustomers(totalCustomers);
        dashboardResponse.setTotalProducts(totalProducts);

        return dashboardResponse;
    }
}