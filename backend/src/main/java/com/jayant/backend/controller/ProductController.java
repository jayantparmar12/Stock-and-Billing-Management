package com.jayant.backend.controller;

import com.jayant.backend.Entity.Product;
import com.jayant.backend.Entity.StockMovement;
import com.jayant.backend.services.ProductService;
import com.jayant.backend.services.StockMovementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/products")
public class ProductController {
    private final ProductService productService;
    private final StockMovementService stockMovementService;

    @GetMapping
    public List<Product> getProducts(){
        return productService.getProducts();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Integer id) {
        return productService.getProductById(id);
    }

    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return productService.addProduct(product);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Integer id) {
        productService.deleteProduct(id);
    }

    @PutMapping
    public Product editProduct(@RequestBody Product product) {
        return productService.editProduct(product);
    }

    @PatchMapping("/{id}/increase-stock")
    public Product increateProduct(@PathVariable Integer id, @RequestParam Integer quantity) {
        return productService.increateProduct(id, quantity);
    }

    @PatchMapping("/{id}/decrease-stock")
    public Product decreaseProduct(@PathVariable Integer id, @RequestParam Integer quantity) {
        return productService.decreaseProduct(id, quantity);
    }

    @GetMapping("/low-stock")
    public List<Product> getLowQuantityProduct(@RequestParam Integer threshold) {
        return productService.getLowQuantityProduct(threshold);
    }

    @GetMapping("{id}/stock-history")
    public List<StockMovement> getStockHistoryOfProduct(@PathVariable Integer id) {
        return stockMovementService.getStockByProductId(id);
    }
}
