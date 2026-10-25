package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.CategoryResponse;
import com.jayant.backend.Entity.Category;
import com.jayant.backend.Entity.Shop;
import com.jayant.backend.repository.CategoryRepo;
import com.jayant.backend.repository.ProductRepo;
import com.jayant.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepo categoryRepo;
    private final ProductRepo productRepo;
    private final CurrentUserService currentUserService;

    public ApiResponse<List<CategoryResponse>> getAllCategory() {
        Integer shopId = currentUserService.getCurrentShopId();
        List<Category> categories = categoryRepo.findByShopId(shopId);

        List<CategoryResponse> responses = new ArrayList<>();
        for (Category category : categories) {
            responses.add(mapToResponse(category, shopId));
        }

        return new ApiResponse<>(true, "List of Categories", responses);
    }

    public ApiResponse<CategoryResponse> getCategoryById(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Category category = categoryRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : " + id
                ));
        return new ApiResponse<>(true, "Category by id : " + id, mapToResponse(category, shopId));
    }

    public ApiResponse<CategoryResponse> addCategory(Category category) {
        Shop currentShop = currentUserService.getCurrentShop();
        category.setShop(currentShop);
        Category saved = categoryRepo.save(category);
        return new ApiResponse<>(true, "Category added successfully", mapToResponse(saved, currentShop.getId()));
    }

    public ApiResponse<CategoryResponse> editCategory(Category category) {
        Shop currentShop = currentUserService.getCurrentShop();
        Category existing = categoryRepo.findByIdAndShopId(category.getId(), currentShop.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : " + category.getId()
                ));

        existing.setName(category.getName());
        existing.setDescription(category.getDescription());
        Category saved = categoryRepo.save(existing);
        return new ApiResponse<>(true, "Category edited successfully", mapToResponse(saved, currentShop.getId()));
    }

    public ApiResponse<Void> deleteCategory(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Category existing = categoryRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : " + id
                ));

        long assignedProducts = productRepo.countByCategoryIdAndShopId(id, shopId);
        if (assignedProducts > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot delete category because " + assignedProducts + " products are assigned to it"
            );
        }

        categoryRepo.delete(existing);
        return new ApiResponse<>(true, "Category deleted successfully", null);
    }

    private CategoryResponse mapToResponse(Category category, Integer shopId) {
        long count = productRepo.countByCategoryIdAndShopId(category.getId(), shopId);
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .productsVariety(count)
                .build();
    }
}
