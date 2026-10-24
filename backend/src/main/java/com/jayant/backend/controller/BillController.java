package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.BillRequest;
import com.jayant.backend.DTO.BillResponse;
import com.jayant.backend.Entity.Payment;
import com.jayant.backend.Entity.Refund;
import com.jayant.backend.services.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/bill")
public class BillController {
    private final BillService billService;

    @PostMapping
    public ApiResponse<BillResponse> createBill(@Valid @RequestBody BillRequest request) {
        return billService.createBill(request);
    }

    @GetMapping("/{id}")
    public ApiResponse<BillResponse> getBillById(@PathVariable Integer id) {
        return billService.getBillById(id);
    }

    @GetMapping
    public ApiResponse<List<BillResponse>> getAllBills() {
        return billService.getAllBills();
    }

    @GetMapping("/customer_id/{id}")
    public ApiResponse<List<BillResponse>> getBillByCustomer(@PathVariable Integer id) {
        return billService.getBillByCustomerId(id);
    }

    @GetMapping("/date-range")
    public ApiResponse<List<BillResponse>> getBillBetweenRange(@RequestParam LocalDateTime start, @RequestParam LocalDateTime end) {
        return billService.getBillBetweenDate(start, end);
    }

    @GetMapping("/search")
    public ApiResponse<List<BillResponse>> getBillByCustomerName(@RequestParam String keyword) {
        return billService.getBillByCustomerName(keyword);
    }

    @PatchMapping("/cancell_bill/{id}")
    public ApiResponse<Void> cancelBill(@PathVariable Integer id) {
        return billService.cancelBill(id);
    }

    @PatchMapping("/bill_id/{id}/payment")
    public ApiResponse<Void> updatePayment(@PathVariable Integer id, @RequestParam BigDecimal payment) {
        return billService.updatePayment(id, payment);
    }

    @GetMapping("{id}/payments")
    public ApiResponse<List<Payment>> getPaymentByBill(@PathVariable Integer id) {
        return billService.getPaymentByBill(id);
    }

    @GetMapping("{id}/refunds")
    public ApiResponse<List<Refund>> getRefundHistory(@PathVariable Integer id) {
        return billService.getRefundHistory(id);
    }
}
