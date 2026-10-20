package com.jayant.backend.controller;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.ProductRequest;
import com.jayant.backend.DTO.ProductResponse;
import com.jayant.backend.Entity.Product;
import com.jayant.backend.Entity.StockMovement;
import com.jayant.backend.services.ProductService;
import com.jayant.backend.services.StockMovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {
    private final ProductService productService;
    private final StockMovementService stockMovementService;

    @GetMapping
    public ApiResponse<List<ProductResponse>> getProducts(){
        return productService.getProducts();
    }

    @GetMapping("/{id}")
    public ApiResponse<Product> getProductById(@PathVariable Integer id) {
        return productService.getProductById(id);
    }

    @PostMapping
    public ApiResponse<ProductResponse> addProduct(@Valid @RequestBody ProductRequest product) {
        return productService.addProduct(product);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProduct(@PathVariable Integer id) {
        return productService.deleteProduct(id);
    }

    @PutMapping
    public ApiResponse<ProductResponse> editProduct(@Valid @RequestBody ProductRequest product) {
        return productService.editProduct(product);
    }

    @PatchMapping("/{id}/increase-stock")
    public ApiResponse<Product> increaseProduct(@PathVariable Integer id, @RequestParam Integer quantity) {
        return productService.increaseProduct(id, quantity);
    }

    @PatchMapping("/{id}/decrease-stock")
    public ApiResponse<Product> decreaseProduct(@PathVariable Integer id, @RequestParam Integer quantity) {
        return productService.decreaseProduct(id, quantity);
    }

    @GetMapping("/low-stock")
    public ApiResponse<List<Product>> getLowQuantityProduct(@RequestParam Integer threshold) {
        return productService.getLowQuantityProduct(threshold);
    }

    @GetMapping("{id}/stock-history")
    public ApiResponse<List<StockMovement>> getStockHistoryOfProduct(@PathVariable Integer id) {
        return stockMovementService.getStockByProductId(id);
    }
}
