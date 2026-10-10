package com.jayant.backend.services;

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

    public List<Customer> getAllCustomers() {
        return customerRepo.findAll();
    }

    public Customer getCustomerById(Integer id) {
        return customerRepo.findById(id).orElseThrow(()-> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Customer Not Found with id : "+id
        ));
    }

    public Customer addCustomer(Customer customer) {
        return customerRepo.save(customer);
    }

    public void deleteCustomer(Integer id) {
        if(customerRepo.existsById(id)) {
            customerRepo.deleteById(id);
        } else {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Customer Not Found with id : "+id
            );
        }
    }

    public Customer editCustomer(Integer id, Customer customer) {
        if(customerRepo.existsById(id)) {
            customer.setId(id);
            return customerRepo.save(customer);
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Customer Not Found with id : "+id
        );
    }
}
