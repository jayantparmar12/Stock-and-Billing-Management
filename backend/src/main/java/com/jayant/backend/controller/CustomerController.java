package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.Customer;
import com.jayant.backend.services.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/customers")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ApiResponse<List<Customer>> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    @GetMapping("/{id}")
    public ApiResponse<Customer> getCustomerById(@PathVariable Integer id) {
        return customerService.getCustomerById(id);
    }

    @PostMapping
    public ApiResponse<Customer> addCustomer(@Valid @RequestBody Customer customer) {
        return customerService.addCustomer(customer);
    }

    @PutMapping
    public ApiResponse<Customer> editCustomer(@Valid @RequestBody Customer customer) {
        return customerService.editCustomer(customer);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCustomer(@PathVariable Integer id) {
        return customerService.deleteCustomer(id);
    }
}
