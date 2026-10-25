package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.Customer;
import com.jayant.backend.Entity.Shop;
import com.jayant.backend.repository.CustomerRepo;
import com.jayant.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepo customerRepo;
    private final CurrentUserService currentUserService;

    public ApiResponse<List<Customer>> getAllCustomers() {
        Integer shopId = currentUserService.getCurrentShopId();
        return new ApiResponse<>(true, "List of customers", customerRepo.findByShopId(shopId));
    }

    public ApiResponse<Customer> getCustomerById(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Customer customer = customerRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer Not Found with id : " + id
                ));
        return new ApiResponse<>(true, "Customer by id", customer);
    }

    public ApiResponse<Customer> addCustomer(Customer customer) {
        Shop currentShop = currentUserService.getCurrentShop();
        customer.setShop(currentShop);
        return new ApiResponse<>(true, "Customer added successfully", customerRepo.save(customer));
    }

    public ApiResponse<Customer> editCustomer(Customer customer) {
        Integer shopId = currentUserService.getCurrentShopId();
        Customer existing = customerRepo.findByIdAndShopId(customer.getId(), shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer Not Found with id : " + customer.getId()
                ));

        existing.setName(customer.getName());
        existing.setPhone(customer.getPhone());
        existing.setEmail(customer.getEmail());
        existing.setAddress(customer.getAddress());

        return new ApiResponse<>(true, "Customer updated successfully", customerRepo.save(existing));
    }

    public ApiResponse<Void> deleteCustomer(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Customer existing = customerRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer Not Found with id : " + id
                ));

        customerRepo.delete(existing);
        return new ApiResponse<>(true, "Customer deleted successfully", null);
    }
}