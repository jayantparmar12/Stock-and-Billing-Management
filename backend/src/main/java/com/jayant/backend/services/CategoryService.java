package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.Entity.Category;
import com.jayant.backend.Entity.Shop;
import com.jayant.backend.repository.CategoryRepo;
import com.jayant.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepo categoryRepo;
    private final CurrentUserService currentUserService;

    public ApiResponse<List<Category>> getAllCategory() {
        Integer shopId = currentUserService.getCurrentShopId();
        return new ApiResponse<>(true, "List of Categories", categoryRepo.findByShopId(shopId));
    }

    public ApiResponse<Category> getCategoryById(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Category category = categoryRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : " + id
                ));
        return new ApiResponse<>(true, "Category by id : " + id, category);
    }

    public ApiResponse<Category> addCategory(Category category) {
        Shop currentShop = currentUserService.getCurrentShop();
        category.setShop(currentShop);
        return new ApiResponse<>(true, "Category added successfully", categoryRepo.save(category));
    }

    public ApiResponse<Category> editCategory(Category category) {
        Shop currentShop = currentUserService.getCurrentShop();
        Category existing = categoryRepo.findByIdAndShopId(category.getId(), currentShop.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : " + category.getId()
                ));

        existing.setName(category.getName());
        existing.setDescription(category.getDescription());
        return new ApiResponse<>(true, "Category edited successfully", categoryRepo.save(existing));
    }

    public ApiResponse<Void> deleteCategory(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Category existing = categoryRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : " + id
                ));

        categoryRepo.delete(existing);
        return new ApiResponse<>(true, "Category deleted successfully", null);
    }
}
