package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.MovementType;
import com.jayant.backend.Entity.Product;
import com.jayant.backend.Entity.StockMovement;
import com.jayant.backend.repository.ProductRepo;
import com.jayant.backend.repository.StockMovementRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockMovementService {
    private final StockMovementRepo stockMovementRepo;
    private final ProductRepo productRepo;

    public StockMovement saveStock(Product product, MovementType movementType, Integer quantity,
                                   Integer previousStock, Integer newStock, String reason) {
        StockMovement stockMovement = new StockMovement();
        stockMovement.setMovementDate(LocalDateTime.now());
        stockMovement.setMovementType(movementType);
        stockMovement.setNewStock(newStock);
        stockMovement.setPreviousStock(previousStock);
        stockMovement.setProduct(product);
        stockMovement.setQuantity(quantity);
        stockMovement.setReason(reason);

        return stockMovementRepo.save(stockMovement);
    }

    public ApiResponse<List<StockMovement>> getStockByProductId(Integer id) {
        if(!productRepo.existsById(id)){
            throw new  ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product Not Found with id : "+id
            );
        }
        return new ApiResponse<>(true, "List of low quantity product , product id : "+id, stockMovementRepo.findByProductIdOrderByMovementDateDesc(id));
    }
}
