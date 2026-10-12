package com.jayant.backend.services;

import com.jayant.backend.Entity.MovementType;
import com.jayant.backend.Entity.Product;
import com.jayant.backend.repository.ProductRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepo productRepo;
    private final StockMovementService stockMovementService;

    public Product addProduct(Product product) {
        return productRepo.save(product);
    }

    public List<Product> getProducts() {
        return productRepo.findAll();
    }

    public Product getProductById(Integer id) {
            return productRepo.findById(id)
                    .orElseThrow(()->new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product Not Found with id : "+id
                    )
            );
    }

    public void deleteProduct(Integer id) {
        if(productRepo.existsById(id)){
            productRepo.deleteById(id);
        }
        else {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product Not Found with id:" + id
            );
        }
    }

    public Product editProduct(Product product) {
        int id = product.getId();
        if(productRepo.existsById(id)){
            return productRepo.save(product);
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product Not Fount with id : "+id
        );
    }

    @Transactional
    public Product increateProduct(Integer id, Integer quantity) {
        if(productRepo.existsById(id)) {
            if (quantity <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Quantity must be greater than 0"
                );
            }
            Product product = productRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Product Not Found : " + id));

            stockMovementService.saveStock(product, MovementType.STOCK_IN, quantity, product.getQuantity(), product.getQuantity()+quantity, "add a new stock");
            product.setQuantity(product.getQuantity() + quantity);
            return productRepo.save(product);
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product Not Found with id : "+id
        );
    }

    @Transactional
    public Product decreaseProduct(Integer id, Integer quantity) {
        if (productRepo.existsById(id)) {
            if (quantity <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Quantity must be greater than 0"
                );
            }
            Product product = productRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Product Not Found : " + id));
            if (product.getQuantity() < quantity) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Insufficient stock"
                );
            }
            stockMovementService.saveStock(product, MovementType.ADJUSTMENT, quantity, product.getQuantity(), product.getQuantity()-quantity, "decrease stock");
            product.setQuantity(product.getQuantity() - quantity);
            return productRepo.save(product);
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product Not Found with id : "+id
        );
    }

    public List<Product> getLowQuantityProduct(Integer threshold) {
        return productRepo.findByQuantityLessThan(threshold);
    }
}
