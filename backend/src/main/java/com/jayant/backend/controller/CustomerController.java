package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.Customer;
import com.jayant.backend.services.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/customers")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerController {
    private final CustomerService customerService;

    @GetMapping
    public ApiResponse<List<Customer>> getCustomers() {
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

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCustomer(@PathVariable Integer id) {
        return customerService.deleteCustomer(id);
    }

    @PutMapping("/{id}")
    public ApiResponse<Customer> editCustomer(@PathVariable Integer id, @RequestBody Customer customer) {
        return customerService.editCustomer(id, customer);
    }
}
