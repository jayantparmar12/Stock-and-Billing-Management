package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.Customer;
import com.jayant.backend.repository.CustomerRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepo customerRepo;

    public ApiResponse<List<Customer>> getAllCustomers() {
        return new ApiResponse<>(true, "List of customers", customerRepo.findAll());
    }

    public ApiResponse<Customer> getCustomerById(Integer id) {
        Customer customer = customerRepo.findById(id).orElseThrow(()-> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Customer Not Found with id : "+id
        ));
        return new ApiResponse<>(true, "Customer of id : "+id, customer);
    }

    public ApiResponse<Customer> addCustomer(Customer customer) {
        return new ApiResponse<>(true, "Customer is added successfully", customerRepo.save(customer));
    }

    public ApiResponse<Void> deleteCustomer(Integer id) {
        if(customerRepo.existsById(id)) {
            customerRepo.deleteById(id);
            return new ApiResponse<>(true, "Customer is deleted", null);
        } else {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Customer Not Found with id : "+id
            );
        }
    }

    public ApiResponse<Customer> editCustomer(Integer id, Customer customer) {
        if(customerRepo.existsById(id)) {
            customer.setId(id);
            return new ApiResponse<>(true, "Customer edited successfully", customerRepo.save(customer));
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Customer Not Found with id : "+id
        );
    }
}
