package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.Payment;
import com.jayant.backend.repository.PaymentRepo;
import com.jayant.backend.security.CurrentUserService;
import com.jayant.backend.services.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/payments")
public class PaymentController {

    private final PaymentRepo paymentRepo;
    private final CurrentUserService currentUserService;
    private final BillService billService;


    @GetMapping
    public ApiResponse<List<Payment>> getAllShopPayments() {
        Integer shopId = currentUserService.getCurrentShopId();
        List<Payment> payments = paymentRepo.findByBill_Shop_IdOrderByPaymentDateDesc(shopId);
        return new ApiResponse<>(true, "All payments for current shop", payments);
    }


    @GetMapping("/bill/{billId}")
    public ApiResponse<List<Payment>> getPaymentsByBill(@PathVariable Integer billId) {
        return billService.getPaymentByBill(billId);
    }


    @PatchMapping("/bill/{billId}")
    public ApiResponse<Void> addPaymentToBill(
            @PathVariable Integer billId,
            @RequestParam BigDecimal payment
    ) {
        return billService.updatePayment(billId, payment);
    }
}