package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.DashboardResponse;
import com.jayant.backend.Entity.BillStatus;
import com.jayant.backend.repository.BillRepo;
import com.jayant.backend.repository.CustomerRepo;
import com.jayant.backend.repository.ProductRepo;
import com.jayant.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepo productRepo;
    private final CustomerRepo customerRepo;
    private final BillRepo billRepo;
    private final CurrentUserService currentUserService;

    public ApiResponse<DashboardResponse> getDashboard() {
        Integer shopId = currentUserService.getCurrentShopId();

        long totalProducts = productRepo.countByShopId(shopId);
        long totalCustomers = customerRepo.countByShopId(shopId);
        long lowStockProducts = productRepo.countByShopIdAndQuantityLessThan(shopId, 11);

        BigDecimal totalSales = billRepo.sumOfTotalAmountByShopId(shopId, BillStatus.CANCELLED);
        if (totalSales == null) totalSales = BigDecimal.ZERO;

        BigDecimal totalPaid = billRepo.sumOfPaidAmountByShopId(shopId, BillStatus.CANCELLED);
        if (totalPaid == null) totalPaid = BigDecimal.ZERO;

        BigDecimal pendingPayment = totalSales.subtract(totalPaid);

        DashboardResponse dashboardResponse = new DashboardResponse();
        dashboardResponse.setTotalSales(totalSales);
        dashboardResponse.setLowStockProducts(lowStockProducts);
        dashboardResponse.setPendingPayments(pendingPayment);
        dashboardResponse.setTotalCustomers(totalCustomers);
        dashboardResponse.setTotalProducts(totalProducts);

        return new ApiResponse<>(true, "Dashboard", dashboardResponse);
    }
}
