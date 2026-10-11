package com.jayant.backend.controller;

import com.jayant.backend.DTO.BillRequest;
import com.jayant.backend.DTO.BillResponse;
import com.jayant.backend.services.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/bill")
public class BillController {
    private final BillService billService;

    @PostMapping
    public BillResponse createBill(@RequestBody BillRequest request) {
        return billService.createBill(request);
    }

    @GetMapping("/{id}")
    public BillResponse getBillById(@PathVariable Integer id) {
        return billService.getBillById(id);
    }

    @GetMapping
    public List<BillResponse> getAllBills() {
        return billService.getAllBills();
    }

    @GetMapping("/customer_id/{id}")
    public List<BillResponse> getBillByCustomer(@PathVariable Integer id) {
        return billService.getBillByCustomerId(id);
    }

    @GetMapping("/date-range")
    public List<BillResponse> getBillBetweenRange(@RequestParam LocalDateTime start, @RequestParam LocalDateTime end) {
        return billService.getBillBetweenDate(start, end);
    }

    @GetMapping("/search")
    public List<BillResponse> getBillByCustomerName(@RequestParam String keyword) {
        return billService.getBillByCustomerName(keyword);
    }

    @PatchMapping("/cancell_bill/{id}")
    public void cancelBill(@PathVariable Integer id) {
        billService.cancelBill(id);
    }
}
