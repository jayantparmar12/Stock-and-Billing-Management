package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.ProductRequest;
import com.jayant.backend.Entity.Category;
import com.jayant.backend.Entity.MovementType;
import com.jayant.backend.Entity.Product;
import com.jayant.backend.repository.CategoryRepo;
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
    private final CategoryRepo categoryRepo;

    public ApiResponse<Product> addProduct(ProductRequest productRequest) {
        Category category = categoryRepo.findById(productRequest.getCategory())
                .orElseThrow(()->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Category Not Found with id : "+productRequest.getCategory()
                        )
                );
        Product product = new Product();
        product.setQuantity(productRequest.getQuantity());
        product.setCategory(category);
        product.setPrice(productRequest.getPrice());
        product.setProduct(productRequest.getProduct());
        product = productRepo.save(product);

        return new ApiResponse<>(true, "Product created", product);
    }

    public ApiResponse<List<Product>> getProducts() {
        List<Product> products = productRepo.findAll();
        return new ApiResponse<>(true, "List of products", products);
    }

    public ApiResponse<Product> getProductById(Integer id) {
            Product product = productRepo.findById(id)
                    .orElseThrow(()->new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product Not Found with id : "+id
                    )
            );
            return new ApiResponse<>(true, "Product by id", product);
    }

    public ApiResponse<Void> deleteProduct(Integer id) {
        if(productRepo.existsById(id)){
            productRepo.deleteById(id);
            return new ApiResponse<>(true, "Product deleted successfully", null);
        }
        else {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product Not Found with id:" + id
            );
        }
    }

    public ApiResponse<Product> editProduct(ProductRequest productRequest) {

        Product product = productRepo.findById(productRequest.getId())
                .orElseThrow(()-> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found with id : "+productRequest.getId()
                ));
        product.setQuantity(productRequest.getQuantity());
        product.setProduct(productRequest.getProduct());
        product.setPrice(productRequest.getPrice());
        Category category = categoryRepo.findById(productRequest.getCategory())
                        .orElseThrow(()-> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Category Not Found with id : "+ productRequest.getCategory()
                        ));
        product.setCategory(category);
        product = productRepo.save(product);
        return new ApiResponse<>(true, "Product edited successfully", product);

    }

    @Transactional
    public ApiResponse<Product> increaseProduct(Integer id, Integer quantity) {
        if(productRepo.existsById(id)) {
            if (quantity <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Quantity must be greater than 0"
                );
            }
            Product product = productRepo.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product Not Found : " + id));

            stockMovementService.saveStock(product, MovementType.STOCK_IN, quantity, product.getQuantity(), product.getQuantity()+quantity, "add a new stock");
            product.setQuantity(product.getQuantity() + quantity);
            product = productRepo.save(product);
            return  new ApiResponse<>(true, "Stock increased successfully", product);
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product Not Found with id : "+id
        );
    }

    @Transactional
    public ApiResponse<Product> decreaseProduct(Integer id, Integer quantity) {
            if (quantity <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Quantity must be greater than 0"
                );
            }
            Product product = productRepo.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product Not Found : " + id));
            if (product.getQuantity() < quantity) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Insufficient stock"
                );
            }
            stockMovementService.saveStock(product, MovementType.ADJUSTMENT, quantity, product.getQuantity(), product.getQuantity()-quantity, "decrease stock");
            product.setQuantity(product.getQuantity() - quantity);
            product = productRepo.save(product);
            return new ApiResponse<>(true, "Product decreased successfully", product);
    }

    public ApiResponse<List<Product>> getLowQuantityProduct(Integer threshold) {
        return new ApiResponse<>(true, "Low quantity products", productRepo.findByQuantityLessThan(threshold));
    }
}
