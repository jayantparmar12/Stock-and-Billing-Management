package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.ProductRequest;
import com.jayant.backend.DTO.ProductResponse;
import com.jayant.backend.Entity.Category;
import com.jayant.backend.Entity.MovementType;
import com.jayant.backend.Entity.Product;
import com.jayant.backend.Entity.Shop;
import com.jayant.backend.repository.CategoryRepo;
import com.jayant.backend.repository.ProductRepo;
import com.jayant.backend.security.CurrentUserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepo productRepo;
    private final StockMovementService stockMovementService;
    private final CategoryRepo categoryRepo;
    private final CurrentUserService currentUserService;

    public ApiResponse<ProductResponse> addProduct(ProductRequest productRequest) {
        Shop currentShop = currentUserService.getCurrentShop();

        Category category = categoryRepo.findByIdAndShopId(productRequest.getCategory(), currentShop.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : " + productRequest.getCategory()
                ));

        Product product = new Product();
        product.setQuantity(productRequest.getQuantity());
        product.setCategory(category);
        product.setPrice(productRequest.getPrice());
        product.setProduct(productRequest.getName());
        product.setShop(currentShop);
        product.setUnit(productRequest.getUnit() != null && !productRequest.getUnit().isBlank() ? productRequest.getUnit() : "pcs");
        product = productRepo.save(product);

        return new ApiResponse<>(true, "Product created", productToProductResponse(product));
    }

    public ApiResponse<List<ProductResponse>> getProducts() {
        Integer shopId = currentUserService.getCurrentShopId();
        List<Product> products = productRepo.findByShopId(shopId);
        List<ProductResponse> productResponses = new ArrayList<>();
        for (Product product : products) {
            productResponses.add(productToProductResponse(product));
        }
        return new ApiResponse<>(true, "List of products", productResponses);
    }

    public ApiResponse<ProductResponse> getProductById(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Product product = productRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product Not Found with id : " + id
                ));
        return new ApiResponse<>(true, "Product by id", productToProductResponse(product));
    }

    public ApiResponse<Void> deleteProduct(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Product product = productRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product Not Found with id:" + id
                ));

        productRepo.delete(product);
        return new ApiResponse<>(true, "Product deleted successfully", null);
    }

    public ApiResponse<ProductResponse> editProduct(ProductRequest productRequest) {
        Shop currentShop = currentUserService.getCurrentShop();

        Product product = productRepo.findByIdAndShopId(productRequest.getId(), currentShop.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found with id : " + productRequest.getId()
                ));

        Category category = categoryRepo.findByIdAndShopId(productRequest.getCategory(), currentShop.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : " + productRequest.getCategory()
                ));

        if (productRequest.getUnit() != null && !productRequest.getUnit().isBlank()) {
            product.setUnit(productRequest.getUnit());
        }

        product.setQuantity(productRequest.getQuantity());
        product.setProduct(productRequest.getName());
        product.setPrice(productRequest.getPrice());
        product.setCategory(category);
        product = productRepo.save(product);

        return new ApiResponse<>(true, "Product edited successfully", productToProductResponse(product));
    }

    @Transactional
    public ApiResponse<Product> increaseProduct(Integer id, Integer quantity) {
        if (quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than 0");
        }

        Integer shopId = currentUserService.getCurrentShopId();
        Product product = productRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product Not Found : " + id));

        stockMovementService.saveStock(
                product,
                MovementType.STOCK_IN,
                quantity,
                product.getQuantity(),
                product.getQuantity() + quantity,
                "add a new stock"
        );
        product.setQuantity(product.getQuantity() + quantity);
        product = productRepo.save(product);
        return new ApiResponse<>(true, "Stock increased successfully", product);
    }

    @Transactional
    public ApiResponse<Product> decreaseProduct(Integer id, Integer quantity) {
        if (quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than 0");
        }

        Integer shopId = currentUserService.getCurrentShopId();
        Product product = productRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product Not Found : " + id));

        if (product.getQuantity() < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock");
        }

        stockMovementService.saveStock(
                product,
                MovementType.ADJUSTMENT,
                quantity,
                product.getQuantity(),
                product.getQuantity() - quantity,
                "decrease stock"
        );
        product.setQuantity(product.getQuantity() - quantity);
        product = productRepo.save(product);
        return new ApiResponse<>(true, "Product decreased successfully", product);
    }

    public ApiResponse<List<Product>> getLowQuantityProduct(Integer threshold) {
        Integer shopId = currentUserService.getCurrentShopId();
        return new ApiResponse<>(
                true,
                "Low quantity products",
                productRepo.findByShopIdAndQuantityLessThan(shopId, threshold)
        );
    }

    private ProductResponse productToProductResponse(Product product) {
        return ProductResponse.builder()
                .name(product.getProduct())
                .category(product.getCategory().getName())
                .id(product.getId())
                .quantity(product.getQuantity())
                .price(product.getPrice())
                .unit(product.getUnit() != null ? product.getUnit() : "pcs")
                .build();
    }
}