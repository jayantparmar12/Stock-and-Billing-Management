package com.jayant.backend.services;

import com.jayant.backend.DTO.ApiResponse;
import com.jayant.backend.DTO.CategoryResponse;
import com.jayant.backend.Entity.Category;
import com.jayant.backend.repository.CategoryRepo;
import com.jayant.backend.repository.ProductRepo;
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

    public ApiResponse<List<CategoryResponse>> getAllCategory() {
        List<Category> categories = categoryRepo.findAll();
        List<CategoryResponse> categoryResponses = new ArrayList<>();
        for (Category category : categories) {
            long products = productRepo.countByCategoryId(category.getId());
            categoryResponses.add(categoryToCategoryResponse(category,products));
        }
        return new ApiResponse<>(true, "List of Categories", categoryResponses);
    }

    public ApiResponse<Category> getCategoryById(Integer id) {
        Category category = categoryRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category Not Found with id : "+id
                ));
        return new ApiResponse<>(true, "Category by id : "+id, category);
    }

    public ApiResponse<CategoryResponse> addCategory(Category category) {
        category = categoryRepo.save(category);
        Long productsVariety = productRepo.countByCategoryId(category.getId());
        return new ApiResponse<>(true, "Category added successfully", categoryToCategoryResponse(category,productsVariety));
    }

    public ApiResponse<CategoryResponse> editCategory(Category category) {
        if(categoryRepo.existsById(category.getId())) {
            category = categoryRepo.save(category);
            Long productVariety = productRepo.countByCategoryId(category.getId());
            return new ApiResponse<>(true, "Category edited successfully", categoryToCategoryResponse(category, productVariety));
        }
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Category Not Found with id : "+category.getId()
        );
    }

    public ApiResponse<Void> deleteCategory(Integer id) {
        if(categoryRepo.existsById(id)) {
            categoryRepo.deleteById(id);
        }
        else {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Category Not Found with id : "+id
            );
        }
        return new ApiResponse<>(true, "Category deleted successfully", null);
    }

    private CategoryResponse categoryToCategoryResponse(Category category, Long products) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .productsVariety(products)
                .description(category.getDescription())
                .build();
    }
}
