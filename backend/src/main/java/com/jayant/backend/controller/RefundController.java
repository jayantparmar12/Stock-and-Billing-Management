package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.Refund;
import com.jayant.backend.repository.RefundRepo;
import com.jayant.backend.security.CurrentUserService;
import com.jayant.backend.services.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/refunds")
@CrossOrigin(origins = "http://localhost:5173")
public class RefundController {

    private final RefundRepo refundRepo;
    private final CurrentUserService currentUserService;
    private final BillService billService;

    @GetMapping
    public ApiResponse<List<Refund>> getAllShopRefunds() {
        Integer shopId = currentUserService.getCurrentShopId();
        List<Refund> refunds = refundRepo.findByBill_Shop_IdOrderByRefundDateDesc(shopId);
        return new ApiResponse<>(true, "All refunds for current shop", refunds);
    }

    @GetMapping("/bill/{billId}")
    public ApiResponse<List<Refund>> getRefundsByBill(@PathVariable Integer billId) {
        return billService.getRefundHistory(billId);
    }
}