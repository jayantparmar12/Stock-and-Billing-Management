package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.MovementType;
import com.jayant.backend.Entity.Product;
import com.jayant.backend.Entity.StockMovement;
import com.jayant.backend.repository.ProductRepo;
import com.jayant.backend.repository.StockMovementRepo;
import com.jayant.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockMovementService {

    private final StockMovementRepo stockMovementRepo;
    private final ProductRepo productRepo;
    private final CurrentUserService currentUserService;

    public StockMovement saveStock(
            Product product,
            MovementType movementType,
            Integer quantity,
            Integer previousStock,
            Integer newStock,
            String reason
    ) {
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
        Integer shopId = currentUserService.getCurrentShopId();
        if (!productRepo.existsByIdAndShopId(id, shopId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product Not Found with id : " + id
            );
        }
        return new ApiResponse<>(
                true,
                "Stock movement history for product id : " + id,
                stockMovementRepo.findByProductIdOrderByMovementDateDesc(id)
        );
    }
}
